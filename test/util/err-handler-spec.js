'use strict';

import chai from 'chai';

import AuthError from '../../lib/auth-error.js';
import i18n from '../../i18n.js';

const { expect } = chai;

const unknownError = new AuthError('unknown');

const throwingHandler = function () {
    throw new Error('Unexpected no error.');
};

const expectedErrorHandlerFn = function (code, ...params) {
    return function expectedErrorHandler(err) {
        if (!(err instanceof AuthError)) {
            console.log(err); // eslint-disable-line no-console
        }
        expect(err).to.be.instanceof(AuthError);
        expect(err.code).to.equal(code);
        expect(err.params).to.deep.equal(params);
        return err;
    };
};

const expectedSeqErrorHandlerFn = function (name, fields) {
    return function expectedSeqErrorHandler(err) {
        expect(err.name).to.equal(name);
        if (fields) {
            expect(err.fields).to.deep.equal(fields);
        }
        return err;
    };
};

const verifyErrorMessage = async function (res, code, ...params) {
    await i18n.changeLanguage('en');
    const expected = (new AuthError(code, ...params)).getMessage(i18n);
    expect(expected).to.not.equal(code);
    expect(expected).to.not.equal(unknownError.getMessage(i18n));
    expect(res.body.message).to.equal(expected);
};

const verifyErrorMessageLang = async function (res, language, code, ...params) {
    await i18n.changeLanguage(language);
    const expected = (new AuthError(code, ...params)).getMessage(i18n);
    expect(expected).to.not.equal(code);
    expect(expected).to.not.equal(unknownError.getMessage(i18n));
    expect(res.body.message).to.equal(expected);
};

export default {
    throwingHandler,
    expectedErrorHandlerFn,
    expectedSeqErrorHandlerFn,
    verifyErrorMessage,
    verifyErrorMessageLang,
};
