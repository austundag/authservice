/* global describe,before,it */

import chai from 'chai';
import config from 'config';
import express from 'express';

import SharedIntegration from './util/shared-integration.js';
import History from './util/history.js';
import SuperTester from './util/super-tester.js';
import AuthorizedGenerator from './util/authorized-generator.js';

const { expect } = chai;

describe('authorized create hook integration', function authorizedCreateHook() {
    const authorizedGenerator = new AuthorizedGenerator();

    const hxUser = new History();
    const superTester = new SuperTester();
    const shared = new SharedIntegration(superTester, authorizedGenerator);

    before(shared.setUpFn());

    let app = null;
    let server = null;
    it('start intercepting server', function startIntercepting(done) {
        app = express();
        app.use(express.json());
        app.post('/createinfo', function createInfo(req, res) {
            app.locals.lastBody = req.body;
            res.status(201).json({ success: true });
        });
        server = app.listen(3002, done);
    });

    let createHookBackup = null;
    const additionalData = { ccList: ['this', 'that'] };
    it('update config for create hook', function updateConfig() {
        const createHook = config.get('hook.create');
        createHookBackup = config.util.cloneDeep(createHook);
        createHook.url = `http://localhost:${server.address().port}/createinfo`;
        createHook.additionalData = { ccList: ['this', 'that'] };
    });

    it('login as super', shared.loginFn(config.superUser));

    it('create a user', shared.createUserFn(hxUser, undefined, { role: 'clinician' }));

    it('check posted data', function checkPostedData() {
        const actual = app.locals.lastBody;
        const expected = Object.assign({}, hxUser.client(0), additionalData);
        expect(actual).to.deep.equal(expected);
    });

    it('revert config', function revertConfig() {
        let createHook = config.get('hook.create');
        Object.assign(createHook, createHookBackup);
        createHook = config.get('hook.create');
        expect(createHook).to.deep.equal(createHookBackup);
    });

    it('logout as super', shared.logoutFn());

    it('close server', function closeServer(done) {
        server.close(done);
    });
});
