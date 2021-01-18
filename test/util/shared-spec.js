import chai from 'chai';
import _ from 'lodash';

import errHandler from './err-handler-spec.js';

const { expect } = chai;

export default class SharedSpec {
    constructor() {
        this.throwingHandler = errHandler.throwingHandler;
    }

    initModels(models, authorizedGenerator) {
        this.models = models;
        this.authorizedGenerator =  authorizedGenerator;
    }

    setUpFn(force = true) {
        const m = this.models;
        return function setUp() {
            return m.sequelize.sync({ force });
        };
    }

    createUserFn(hxUser, override) {
        const self = this;
        return function createUser() {
            const user = self.authorizedGenerator.newUser(override);
            return self.models.user.createUser(user)
                .then(({ id }) => {
                    const server = { id, ...user };
                    hxUser.push(user, server);
                });
        };
    }

    authenticateUserFn(hxUser, index) {
        const self = this;
        return function authenticateUser() {
            const client = hxUser.client(index);
            const username = client.username || client.email;
            return self.models.auth.authenticateUser(username, client.password);
        };
    }

    expectedErrorHandler(code, ...params) { // eslint-disable-line class-methods-use-this
        return errHandler.expectedErrorHandlerFn(code, ...params);
    }

    expectedSeqErrorHandler(name, fields) { // eslint-disable-line class-methods-use-this
        return errHandler.expectedSeqErrorHandlerFn(name, fields);
    }
}

