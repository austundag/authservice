/* eslint no-param-reassign: 0, max-len: 0 */

import chai from 'chai';
import _ from 'lodash';

import appgen from '../../app-generator.js';
import comparator from './comparator.js';
import errHandler from './err-handler-spec.js';
import SharedSpec from './shared-spec.js';

const { expect } = chai;

export default class SharedIntegration {
    constructor(rrSuperTest, generator) {
        this.generator = generator;
        this.rrSuperTest = rrSuperTest;
        this.sharedSpec = new SharedSpec(generator);
    }

    setUpFn() {
        const { rrSuperTest } = this;
        const self = this;
        return async function setup() {
            const app = await appgen.generate();
            self.sharedSpec.initModels(app.locals.models, self.generator);
            self.models = app.locals.models;
            rrSuperTest.initialize(app);
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
                rrSuperTests.forEach((rrSuperTest) => rrSuperTest.initialize(app));
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
        const { rrSuperTest } = this;
        return function login() {
            const fullUser = { id: 1, role: 'admin', ...user };
            return rrSuperTest.authBasic(fullUser);
        };
    }

    loginIndexFn(hxUser, index) {
        const self = this;
        return function loginIndex() {
            const user = _.cloneDeep(hxUser.client(index));
            user.username = user.username || user.email.toLowerCase();
            user.id = hxUser.id(index);
            return self.rrSuperTest.authBasic(user);
        };
    }

    logoutFn() {
        const { rrSuperTest } = this;
        return function logout() {
            rrSuperTest.resetAuth();
        };
    }

    badLoginFn(login) {
        const { rrSuperTest } = this;
        return function badLogin() {
            return rrSuperTest.authBasic(login, 401);
        };
    }

    createProfileSurveyFn(hxSurvey) {
        const { generator } = this;
        const { rrSuperTest } = this;
        return function createProfileSurvey(done) {
            const clientSurvey = generator.newSurvey();
            rrSuperTest.post('/profile-survey', clientSurvey, 201)
                .end((err, res) => {
                    if (err) {
                        return done(err);
                    }
                    const { userId } = rrSuperTest;
                    const server = { id: res.body.id, authorId: userId };
                    Object.assign(server, clientSurvey);
                    hxSurvey.push(clientSurvey, server);
                    return done();
                });
        };
    }

    verifyProfileSurveyFn(hxSurvey, index) {
        const { rrSuperTest } = this;
        return function verifyProfileSurvey(done) {
            rrSuperTest.get('/profile-survey', false, 200)
                .expect((res) => {
                    expect(res.body.exists).to.equal(true);
                    const { survey } = res.body;
                    const id = hxSurvey.id(index);
                    expect(survey.id).to.equal(id);
                    const expected = _.cloneDeep(hxSurvey.server(index));
                    if (rrSuperTest.userRole !== 'admin') {
                        delete expected.authorId;
                    }
                    comparator.survey(expected, survey);
                    hxSurvey.updateServer(index, survey);
                })
                .end(done);
        };
    }

    createDirectUserFn(hxUser, override) {
        return this.sharedSpec.createUserFn(hxUser, override);
    }

    createUserFn(history, user, override) {
        const { generator } = this;
        const { rrSuperTest } = this;
        return function createUser() {
            if (!user) {
                user = generator.newUser(override);
            }
            return rrSuperTest.post('/users', user, 201)
                .then((res) => {
                    const server = { id: res.body.id, ...user };
                    history.push(user, server);
                });
        };
    }

    createSurveyProfileFn(survey) {
        const { rrSuperTest } = this;
        return function createSurveyProfile(done) {
            rrSuperTest.post('/profile-survey', survey, 201)
                .expect((res) => {
                    expect(!!res.body.id).to.equal(true);
                })
                .end(done);
        };
    }

    createConsentFn(hxConsent, hxConsentDocument, typeIndices) {
        const { rrSuperTest } = this;
        const { generator } = this;
        return function createConsent(done) {
            const sections = typeIndices.map((typeIndex) => hxConsentDocument.typeId(typeIndex));
            const clientConsent = generator.newConsent({ sections });
            rrSuperTest.post('/consents', clientConsent, 201)
                .expect((res) => {
                    hxConsent.pushWithId(clientConsent, res.body.id);
                })
                .end(done);
        };
    }

    verifyConsentFn(hxConsent, index) {
        const { rrSuperTest } = this;
        return function verifyConsent(done) {
            const id = hxConsent.id(index);
            rrSuperTest.get(`/consents/${id}`, true, 200)
                .expect((res) => {
                    const expected = hxConsent.server(index);
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    }

    signConsentTypeFn(hxConsentDocument, userIndex, typeIndex) {
        const { rrSuperTest } = this;
        return function signConsentType(done) {
            const consentDocumentId = hxConsentDocument.id(typeIndex);
            hxConsentDocument.sign(typeIndex, userIndex);
            rrSuperTest.post('/consent-signatures', { consentDocumentId }, 201).end(done);
        };
    }

    bulkSignConsentTypeFn(hxConsentDocument, userIndex, typeIndices) {
        const { rrSuperTest } = this;
        return function bulkSignConsentType(done) {
            const consentDocumentIds = typeIndices.map((typeIndex) => hxConsentDocument.id(typeIndex));
            typeIndices.forEach((typeIndex) => hxConsentDocument.sign(typeIndex, userIndex));
            rrSuperTest.post('/consent-signatures/bulk', { consentDocumentIds }, 201).end(done);
        };
    }

    verifyErrorMessage(res, code, ...params) { // eslint-disable-line class-methods-use-this
        return errHandler.verifyErrorMessage(res, code, ...params);
    }

    verifyErrorMessageLang(res, language, code, ...params) { // eslint-disable-line class-methods-use-this
        return errHandler.verifyErrorMessageLang(res, language, code, ...params);
    }
}