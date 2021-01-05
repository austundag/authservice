/* global describe,before,it */

import _ from 'lodash';

import SharedSpec from './util/shared-spec.js';
import History from './util/history.js';
import generator from '../models/generator.js';
import testJsutil from './util/test-jsutil.js';
import AuthorizedGenerator from './util/authorized-generator.js';

const authorizedGenerator = new AuthorizedGenerator();

describe('auth unit', () => {
    let models;
    const shared = new SharedSpec(generator);

    const userCount = 4;

    const hxUser = new History();

    before(async function initialization() {
        models = generator.generate();
        shared.initModels(models, authorizedGenerator);
        return models.sequelize.sync({ force: true });
    });

    const authenticateUserBadPWFn = function (index) {
        return function authenticateUserBadPW() {
            const client = hxUser.client(index);
            const username = client.username || client.email;
            return models.auth.authenticateUser(username, `${client.password}a`)
                .then(shared.throwingHandler, shared.expectedErrorHandler('authenticationError'));
        };
    };

    const authenticateOppositeCaseUserFn = function (index) {
        return function authenticateOppositeCaseUser() {
            const client = hxUser.client(index);
            if (!client.username) {
                const username = testJsutil.oppositeCase(client.email);
                return models.auth.authenticateUser(username, client.password);
            }
            return null;
        };
    };

    const authenticateOppositeCaseUserErrorFn = function (index) {
        return function authenticateOppositeCaseUserError() {
            const client = hxUser.client(index);
            if (client.username) {
                const username = testJsutil.oppositeCase(client.username);
                return models.auth.authenticateUser(username, client.password)
                    .then(shared.throwingHandler, shared.expectedErrorHandler('authenticationError'));
            }
            return null;
        };
    };

    const updateUserPasswordFn = function (index) {
        return function updateUserPassword() {
            const client = hxUser.client(index);
            const password = `${client.password}updated`;
            const id = hxUser.id(index);
            return models.user.updateUser(id, { password })
                .then(() => { client.password = password; });
        };
    };

    const updateUserFn = function (index) {
        return function updateUser() {
            const client = hxUser.client(index);
            const { username, email, password } = client;
            const updateFields = { email: `u${email}`, password: `u${password}` };
            if (username) {
                updateFields.username = `u${username}`;
            }
            const id = hxUser.id(index);
            return models.user.updateUser(id, updateFields)
                .then(() => {
                    if (username) {
                        client.username = updateFields.username;
                    }
                    client.email = updateFields.email;
                    client.password = updateFields.password;
                });
        };
    };

    _.range(userCount).forEach((index) => {
        it(`create user ${index}`, shared.createUserFn(hxUser));
        it(`authenticate user ${index}`, shared.authenticateUserFn(hxUser, index));
        it(`error: authenticate user ${index} with wrong password`, authenticateUserBadPWFn(index));
        it(`update password for user ${index}`, updateUserPasswordFn(index));
        it(`authenticate user ${index}`, shared.authenticateUserFn(hxUser, index));
        it(`error: authenticate user ${index} with opposite case username`, authenticateOppositeCaseUserErrorFn(index));
        it(`authenticate user ${index} with opposite case username (when email) `, authenticateOppositeCaseUserFn(index));
    });

    _.range(userCount).forEach((index) => {
        it(`update user ${index}`, updateUserFn(index));
        it(`authenticate user ${index}`, shared.authenticateUserFn(hxUser, index));
    });

    it('sanity check both direct username and email username are tested', shared.sanityEnoughUserTested(hxUser));
});
