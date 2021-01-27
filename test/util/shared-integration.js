/* eslint no-param-reassign: 0, max-len: 0 */

import chai from 'chai';
import _ from 'lodash';

import appgen from '../../app-generator.js';
import comparator from './comparator.js';
import errHandler from './err-handler-spec.js';
import SharedSpec from './shared-spec.js';

const { expect } = chai;

export default class SharedIntegration {
    constructor(superTester, generator) {
        this.generator = generator;
        this.superTester = superTester;
        this.sharedSpec = new SharedSpec(generator);
    }

    setUpFn() {
        const { superTester } = this;
        const self = this;
        return async function setup() {
            const app = await appgen.generate();
            self.sharedSpec.initModels(app.locals.models, self.generator);
            self.models = app.locals.models;
            superTester.initialize(app);
        };
    }

    getModels() {
        return this.models;
    }

    static setUpMultiFn(rrSuperTests, options = {}) {
        return function setupMulti(done) {
            appgen.generate(options, (err, app) => {
                if (err) {
                    return done(err);
                }
                rrSuperTests.forEach((superTester) => superTester.initialize(app));
                return done();
            });
        };
    }

    setUpErrFn(options = {}) { // eslint-disable-line class-methods-use-this
        return function setupErr(done) {
            appgen.generate(options, (err) => {
                if (!err) {
                    return done(new Error('Expected error did not happen.'));
                }
                return done();
            });
        };
    }

    loginFn(user) {
        const { superTester } = this;
        return function login() {
            const fullUser = { id: 1, role: 'admin', ...user };
            return superTester.authBasic(fullUser);
        };
    }

    loginIndexFn(hxUser, index) {
        const self = this;
        return function loginIndex() {
            const user = _.cloneDeep(hxUser.client(index));
            user.username = user.username || user.email.toLowerCase();
            user.id = hxUser.id(index);
            return self.superTester.authBasic(user);
        };
    }

    logoutFn() {
        const { superTester } = this;
        return function logout() {
            superTester.resetAuth();
        };
    }

    badLoginFn(login) {
        const { superTester } = this;
        return function badLogin() {
            return superTester.authBasic(login, 401);
        };
    }

    createDirectUserFn(hxUser, override) {
        return this.sharedSpec.createUserFn(hxUser, override);
    }

    createUserFn(history, user, override) {
        const { generator } = this;
        const { superTester } = this;
        return function createUser() {
            if (!user) {
                user = generator.newUser(override);
            }
            return superTester.post('/authorizeds', user, 201)
                .then((res) => {
                    const server = { id: res.body.id, ...user };
                    history.push(user, server);
                });
        };
    }

    verifyErrorMessage(res, code, ...params) { // eslint-disable-line class-methods-use-this
        return errHandler.verifyErrorMessage(res, code, ...params);
    }

    verifyErrorMessageLang(res, language, code, ...params) { // eslint-disable-line class-methods-use-this
        return errHandler.verifyErrorMessageLang(res, language, code, ...params);
    }
}
