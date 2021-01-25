const statusCodeMap = {
    resetPasswordHookMissing: 500,
    resetPasswordServerError: 500,
}

export default class AuthError extends Error {
    constructor(code, ...params) {
        super(code);
        this.name = 'AuthError';
        this.code = code;
        this.params = params;
        this.statusCode = statusCodeMap[code] || 400;
    }

    getMessage(i18n) {
        const i18nParams = this.params.reduce((r, param, index) => {
            r[`$${index}`] = param;
            return r;
        }, {});
        return i18n.t([this.code, 'unknown'], i18nParams);
    }

    static reject(code, ...params) {
        const err = new AuthError(code, ...params);
        return Promise.reject(err);
    }
}
