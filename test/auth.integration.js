/* global describe,before,it */

import jwt from 'jsonwebtoken';
import chai from 'chai';
import sinon from 'sinon';
import _ from 'lodash';
import config from 'config';

import tokener from '../lib/tokener.js';

import SharedIntegration from './util/shared-integration.js';
import RRSuperTest from './util/rr-super-test.js';
import History from './util/history.js';
import AuthorizedGenerator from './util/authorized-generator.js';

const { expect } = chai;

describe('auth integration', () => {
    const authorizedGenerator = new AuthorizedGenerator();

    const userCount = 4;

    const rrSuperTest = new RRSuperTest();
    const shared = new SharedIntegration(rrSuperTest, authorizedGenerator);
    const hxUser = new History();

    before(shared.setUpFn());

    _.range(userCount).forEach((index) => {
        it(`create user ${index} using model`, shared.createDirectUserFn(hxUser));
    });

    const successfullLoginFn = function (index) {
        return function successfullLogin() {
            const client = hxUser.client(index);
            let { username } = client;
            const { email } = client;
            const { password } = client;
            if (!username) {
                username = email;
            }
            return rrSuperTest.authBasic({ username, password })
                .then(() => {
                    const jwtCookie = rrSuperTest.getJWT();
                    return jwt.verify(jwtCookie.value, config.jwt.secret, {}, (err2, jwtObject) => {
                        if (err2) {
                            throw err2;
                        }
                        const id = hxUser.id(index);
                        expect(jwtObject.username).to.equal(client.username || client.email.toLowerCase());
                        expect(jwtObject.id).to.equal(id);
                    });
                });
        };
    };

    const wrongUsernameFn = function (index) {
        return function wrongUsername() {
            const client = hxUser.client(index);
            let { username } = client;
            const { email } = client;
            const { password } = client;
            if (!username) {
                username = email;
            }
            username += `u${username}`;
            return rrSuperTest.authBasic({ username, password }, 401)
                .then((res) => shared.verifyErrorMessage(res, 'authenticationError'));
        };
    };

    const wrongPasswordFn = function (index) {
        return function wrongPassword() {
            const client = hxUser.client(index);
            let { username } = client;
            const { email } = client;
            let { password } = client;
            if (!username) {
                username = email;
            }
            password += 'a';
            return rrSuperTest.authBasic({ username, password }, 401)
                .then((res) => shared.verifyErrorMessage(res, 'authenticationError'));
        };
    };

    _.range(userCount).forEach((index) => {
        it(`user ${index} successfull login`, successfullLoginFn(index));
        it(`log out user ${index}`, () => {
            rrSuperTest.resetAuth();
        });
        it(`user ${index} wrong username`, wrongUsernameFn(index));
        it(`user ${index} wrong password`, wrongPasswordFn(index));
    });

    it('token creation throws', (done) => {
        sinon.stub(tokener, 'createJWT').callsFake(() => {
            throw new Error('stub error');
        });
        const { username, password } = hxUser.client(0);

        rrSuperTest.authBasic({ username, password }, 500)
            .end((err, res) => {
                tokener.createJWT.restore();
                if (err) {
                    return done(err);
                }
                expect(typeof res.body).to.equal('object');
                expect(res.body.message).to.equal('stub error');
                return done();
            });
    });
});
