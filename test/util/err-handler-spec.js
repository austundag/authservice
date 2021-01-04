'use strict';

import chai from 'chai';

import AuthError from '../../lib/auth-error.js';

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

export default {
    throwingHandler,
    expectedErrorHandlerFn,
    expectedSeqErrorHandlerFn,
};
