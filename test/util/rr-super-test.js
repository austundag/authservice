import path from 'path';

import supertest from 'supertest';
import session from 'supertest-session';
import _ from 'lodash';

export default class RRSupertest {
    constructor(addlPath) {
        this.server = null;
        this.baseUrl = '';
        if (addlPath) {
            this.baseUrl += addlPath;
        }
        this.username = null;
    }

    initializeUrl(url) {
        this.server = supertest(url);
    }

    initialize(app) {
        this.app = app;
        this.server = session(app);
        this.username = null;
    }

    getModels() {
        return this.app.locals.models;
    }

    shutDown() {
        return this.app.locals.models.sequelize.close();
    }

    authBasic(user, status = 200) {
        if (status === 200) {
            this.username = user.username;
            this.userId = user.id;
            this.userRole = user.role;
        }
        return this.server
            .get(`${this.baseUrl}/auth/basic`)
            .auth(user.username, user.password)
            .expect(status);
    }

    resetAuth() {
        this.server = session(this.app);
        this.username = null;
        this.userId = null;
        this.userRole = null;
    }

    getJWT() {
        const jwt = _.find(this.server.cookies, (cookie) => cookie.name === 'rr-jwt-token');
        return jwt;
    }

    update(operation, endpoint, payload, status, header) {
        const r = this.server[operation](this.baseUrl + endpoint);
        if (header) {
            _.toPairs(header).forEach(([key, value]) => r.set(key, value));
        }
        return r.send(payload).expect(status);
    }

    post(endpoint, payload, status, header, validationError) {
        return this.update('post', endpoint, payload, status, header, validationError);
    }

    postFile(endpoint, field, filepath, payload, status) {
        const filename = path.basename(filepath);
        const request = this.server
            .post(this.baseUrl + endpoint)
            .attach(field, filepath, filename);
        if (payload) {
            return request.field(payload).expect(status);
        }
        return request.expect(status);
    }

    patch(endpoint, payload, status, header) {
        return this.update('patch', endpoint, payload, status, header);
    }

    put(endpoint, payload, status, query) {
        let r = this.server.put(this.baseUrl + endpoint);
        if (query && !_.isEmpty(query)) {
            r = r.query(query);
        }
        return r.send(payload).expect(status);
    }

    authPost(endpoint, payload, status, header) {
        const { user } = payload;
        if (status < 401) {
            this.username = user.username || user.email.toLowerCase();
        }
        return this.update('post', endpoint, payload, status, header).expect(status);
    }

    delete(endpoint, status, query) {
        let r = this.server.delete(this.baseUrl + endpoint);
        if (query) {
            r = r.query(query);
        }
        return r.expect(status);
    }

    get(endpoint, auth, status, query) {
        let r = this.server.get(this.baseUrl + endpoint);
        if (query && !_.isEmpty(query)) {
            r = r.query(query);
        }
        return r.expect(status);
    }
}
