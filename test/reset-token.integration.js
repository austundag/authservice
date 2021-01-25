/* global describe,before,after,it */

import chai from 'chai';
import express from 'express';

import SharedIntegration from './util/shared-integration.js';
import RRSuperTest from './util/rr-super-test.js';
import History from './util/history.js';
import AuthorizedGenerator from './util/authorized-generator.js';

import config from 'config';

const { expect } = chai;

describe('reset-token integration', function resetTokenIntegration() {
    const authorizedGenerator = new AuthorizedGenerator();

    const rrSuperTest = new RRSuperTest();
    const shared = new SharedIntegration(rrSuperTest, authorizedGenerator);
    const userExample = authorizedGenerator.newUser();
    const hxUser = new History();

    before(shared.setUpFn());

    let app = null;
    let server = null;
    it('start intercepting server', function startIntercepting(done) {
        app = express();
        app.use(express.json());
        app.post('/reset-password-token', function postResetPasswordToken(req, res) {
            app.locals.lastBody = req.body;
            res.status(204).end();
        });
        server = app.listen(3002, done);
    });

    it(`create user using model`, shared.createDirectUserFn(hxUser, userExample));

    it('verify user can login', shared.loginIndexFn(hxUser, 0));

    let token = null;

    it('error: no reset password hook specified', function noSmtp() {
        const { email } = userExample;
        return rrSuperTest.post('/reset-password-token', { email }, 500)
            .then((res) => shared.verifyErrorMessage(res, 'resetPasswordHookMissing'));
    });

    let resetPasswordUrl;
    it('update config for reset password hook', function updateConfig() {
        const resetPassword = config.get('hook.resetPassword');
        resetPasswordUrl = resetPassword.url;
        resetPassword.url = `http://localhost:${server.address().port}/reset-password-token`;
    });

    it('generate reset tokens', function resetToken2() {
        const { email } = userExample;
        return rrSuperTest.post('/reset-password-token', { email }, 204);
    });

    it('verify user can not login', shared.badLoginFn(userExample));

    it('check hook post to send email', function checkHookToSendEmail() {
        const actual = app.locals.lastBody;
        token = actual.token;
        expect(token).to.not.equal(null);
        const expected = Object.assign({}, hxUser.client(0), { token });
        delete expected.role;
        delete expected.password;
        delete expected.institution;
        expect(actual).to.deep.equal(expected);
    });

    it('reset password', function resetPassword() {
        const password = 'newPassword';
        return rrSuperTest.post('/authorizeds/password', { token, password }, 204);
    });

    it('verify user can not login with old password', shared.badLoginFn(userExample));

    it('update client password', function updatePassword() {
        hxUser.client(0).password = 'newPassword';
    });

    it('verify user can login', shared.loginIndexFn(hxUser, 0));

    it('revert config', function revertConfig() {
        const resetPassword = config.get('hook.resetPassword');
        resetPassword.url = resetPasswordUrl;
    });

    after((done) => {
        server.close(done);
    });
});
