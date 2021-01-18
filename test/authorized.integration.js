/* global describe,before,it */
/* eslint no-param-reassign: 0, max-len: 0 */

import chai from 'chai';
import _ from 'lodash';
import config from 'config';

import SharedIntegration from './util/shared-integration.js';
import History from './util/history.js';
import RRSuperTest from './util/rr-super-test.js';
import comparator from './util/comparator.js';
import AuthorizedGenerator from './util/authorized-generator.js';

const { expect } = chai;

describe('user integration', function userIntegration() {
    const authorizedGenerator = new AuthorizedGenerator();

    let userCount = 8;
    const hxUser = new History();
    const rrSuperTest = new RRSuperTest();
    const shared = new SharedIntegration(rrSuperTest, authorizedGenerator);

    before(shared.setUpFn());

    it('error: get user without previous authentication', (done) => {
        rrSuperTest.get('/authorizeds/me', true, 401).end(done);
    });

    it('login as super', shared.loginFn(config.superUser));

    // it('error: get user with wrong jwt token', function (done) {
    //    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
    // .eyJpZCI6MiwidXNlcm5hbWUiOiJ1ZXN0Iiwicm9sZSI6bnVsbCwiaWF0
    // IjoxNDczNTAwNzE5LCJleHAiOjE0NzYwOTI3MTl9
    // .e0ymr0xrDPuQEBmdQLjb5-WegNtYcqAcpKp_DtDRKo8';
    //    rrSuperTest.get('/authorizeds/me', jwt, 401).end(done);
    // });

    it('get super user', () => rrSuperTest.get('/authorizeds/me', true, 200)
        .then((res) => {
            const user = res.body;
            expect(!user).to.equal(false);
            expect(user.username).to.equal(config.get('superUser.username'));
            expect(user.role).to.equal('admin');
        }));

    const getUserFn = function (index) {
        return function getUser() {
            const id = hxUser.id(index);
            return rrSuperTest.get(`/authorizeds/${id}`, true, 200)
                .then((res) => {
                    const client = hxUser.client(index);
                    comparator.user(client, res.body);
                    hxUser.updateServer(index, res.body);
                });
        };
    };

    _.range(userCount / 2).forEach((index) => {
        it(`create user ${index}`, shared.createUserFn(hxUser));
        it(`get user ${index}`, getUserFn(index));
    });

    _.range(userCount / 2, userCount).forEach((index) => {
        it(`create user ${index}`, shared.createUserFn(hxUser, undefined, { role: 'clinician' }));
        it(`get user ${index}`, getUserFn(index));
    });

    it('list all non admin users', () => rrSuperTest.get('/authorizeds', true, 200)
        .then((res) => {
            let expected = _.cloneDeep(hxUser.listServers());
            expected = _.sortBy(expected, 'username');
            const actual = _.sortBy(res.body, 'username');
            expect(actual).to.deep.equal(expected);
        }));

    const listUsersByRoleFn = function (role, range) {
        return function listUsersByRole() {
            return rrSuperTest.get('/authorizeds', true, 200, { role })
                .then((res) => {
                    let expected = _.cloneDeep(hxUser.listServers(undefined, range));
                    expected = _.sortBy(expected, 'username');
                    const actual = _.sortBy(res.body, 'username');
                    expect(actual).to.deep.equal(expected);
                });
        };
    };

    it('list participant users', listUsersByRoleFn('participant', _.range(userCount / 2)));
    it('list clinician users', listUsersByRoleFn('clinician', _.range(userCount / 2, userCount)));

    it('logout as super', shared.logoutFn());

    it('login as new user', shared.loginIndexFn(hxUser, 0));

    it('get new user', () => rrSuperTest.get('/authorizeds/me', true, 200)
        .then((res) => {
            const expectedUser = _.cloneDeep(hxUser.client(0));
            expectedUser.role = 'participant';
            delete expectedUser.password;
            expectedUser.id = res.body.id;
            expect(res.body).to.deep.equal(expectedUser);
        }));

    it('login as super', shared.loginFn(config.get('superUser')));

    it('error: create user with bad email', () => {
        const user = hxUser.client(0);
        const userEmailErr = _.cloneDeep(user);
        userEmailErr.email = 'notanemail';
        userEmailErr.username = `${user.username}1`;
        return rrSuperTest.post('/authorizeds', userEmailErr, 400, undefined, true);
    });

    it('error: create the same user', () => {
        const user = hxUser.client(0);
        return rrSuperTest.post('/authorizeds', user, 400)
            .then((res) => shared.verifyErrorMessage(res, 'genericUnique', 'username', user.username));
    });

    it('error: create user with the same email', () => {
        const user = hxUser.client(0);
        const newUser = { ...user };
        newUser.username = 'anotherusername';
        return rrSuperTest.post('/authorizeds', newUser, 400)
            .then((res) => shared.verifyErrorMessage(res, 'uniqueEmail'));
    });

    it('logout as super', shared.logoutFn());

    const verifySelfUserFn = function (index) {
        return function verifySelfUser() {
            return rrSuperTest.get('/authorizeds/me', true, 200)
                .then((res) => {
                    const expected = _.omit(hxUser.server(index), ['createdAt', 'firstname', 'institution', 'lastname']);
                    expect(res.body).to.deep.equal(expected);
                });
        };
    };

    const patchSelfUserEmailFn = function (index) {
        return function patchSelfUserEmail() {
            const { email } = authorizedGenerator.newUser();
            return rrSuperTest.patch('/authorizeds/me', { email }, 204)
                .then(() => {
                    const client = hxUser.client(index);
                    const server = hxUser.server(index);
                    if (!client.username) {
                        server.username = email.toLowerCase();
                    }
                    server.email = email;
                    client.email = email;
                });
        };
    };

    _.range(userCount).forEach((index) => {
        it(`login as user ${index}`, shared.loginIndexFn(hxUser, index));
        it(`self patch user ${index} email`, patchSelfUserEmailFn(index));
        it(`self verify user ${index}`, verifySelfUserFn(index));
        it(`logout as user ${index}`, shared.logoutFn());
    });

    const verifyUserFn = function (index) {
        return function verifyUser() {
            const id = hxUser.id(index);
            return rrSuperTest.get(`/authorizeds/${id}`, true, 200)
                .then((res) => {
                    expect(res.body).to.deep.equal(hxUser.server(index));
                });
        };
    };

    const patchUserEmailFn = function (index) {
        return function patchUserEmail() {
            const { email } = authorizedGenerator.newUser();
            const id = hxUser.id(index);
            return rrSuperTest.patch(`/authorizeds/${id}`, { email }, 204)
                .then(() => {
                    const client = hxUser.client(index);
                    const server = hxUser.server(index);
                    if (!client.username) {
                        server.username = email.toLowerCase();
                    }
                    server.email = email;
                    client.email = email;
                });
        };
    };

    it('login as super', shared.loginFn(config.superUser));

    _.range(userCount).forEach((index) => {
        it(`patch user ${index} email`, patchUserEmailFn(index));
        it(`verify user ${index}`, verifyUserFn(index));
    });

    it('logout as super', shared.logoutFn());

    it('login as new user', shared.loginIndexFn(hxUser, 0));

    const userUpdate = {
        email: 'newone@example.com',
        password: 'newone',
    };

    it('update all user fields including password', () => rrSuperTest.patch('/authorizeds/me', userUpdate, 204));

    it('logout as new user', shared.logoutFn());

    it('error: bad login with old password', () => rrSuperTest.authBasic(hxUser.client(0), 401)
        .expect(() => {
            Object.assign(hxUser.client(0), userUpdate);
        }));

    it('login with updated password', shared.loginIndexFn(hxUser, 0));

    it('verify updated user fields', () => rrSuperTest.get('/authorizeds/me', true, 200)
        .then((res) => {
            const expected = _.cloneDeep(userUpdate);
            expected.role = 'participant';
            expected.id = res.body.id;
            delete expected.password;
            expected.username = hxUser.client(0).username;
            expect(res.body).to.deep.equal(expected);
        }));

    it('verify updated user fields', () => rrSuperTest.get('/authorizeds/me', true, 200)
        .then((res) => {
            const expected = _.pick(userUpdate, ['email']);
            const actual = _.omit(res.body, ['id', 'role', 'username']);
            expect(actual).to.deep.equal(expected);
        }));

    it('logout as new user', shared.logoutFn());

    const patchUserFn = function (index, userPatch) {
        return function patchUser() {
            const id = hxUser.id(index);
            return rrSuperTest.patch(`/authorizeds/${id}`, userPatch, 204)
                .then(() => {
                    const server = hxUser.server(index);
                    ['firstname', 'lastname'].forEach((key) => {
                        if (userPatch[key]) {
                            server[key] = userPatch[key];
                        } else {
                            delete server[key];
                        }
                    });
                });
        };
    };

    it('login as super', shared.loginFn(config.superUser));

    it(`create user ${userCount}`, shared.createUserFn(hxUser, null, {
        lastname: 'lastname',
        firstname: 'firstname',
    }));
    it(`get user ${userCount}`, getUserFn(userCount));
    it(`patch user ${userCount}`, patchUserFn(userCount, { firstname: 'updfn', lastname: '' }));
    it(`verify user ${userCount}`, verifyUserFn(userCount));
    it(`patch user ${userCount}`, patchUserFn(userCount, { firstname: '', lastname: 'updln' }));

    it(`verify user ${userCount}`, verifyUserFn(userCount));

    userCount += 1;

    it('logout as super', shared.logoutFn());
});
