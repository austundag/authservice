export default class AuthError extends Error {
    constructor(code, ...params) {
        super(code);
        this.name = 'AuthError';
        this.code = code;
        this.params = params;
    }

    static reject(code, ...params) {
        const err = new AuthError(code, ...params);
        return Promise.reject(err);
    }
}
