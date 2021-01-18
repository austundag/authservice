'use strict';

import _ from 'lodash';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import expressWinston from 'express-winston';
import config from 'config';

import i18nMiddleware from 'i18next-express-middleware';

import security from './lib/security.js';
import logger from './logger.js';
import * as jsutil from './lib/jsutil.js';
import i18n from './i18n.js';
import generator from './models/generator.js';

import * as authController from './controllers/auth.controller.js';
import * as authorizedController from './controllers/authorized.controller.js';

const errHandler = function (err, req, res, next) { // eslint-disable-line no-unused-vars
    logger.error(err);

    const jsonErr = jsutil.errToJSON(err);
    if ((!res.statusCode) || (res.statusCode < 300)) {
        res.statusCode = 500;
    }
    res.json(jsonErr);
};

const modelsSupplyFn = function (models) {
    return function modelsSupply(req, res, next) { // eslint-disable-line no-unused-vars
        req.models = models;
        next();
    };
};

const authorization = function(role) {
    return function authorizationImplementation(req, res, next) {  // eslint-disable-line no-unused-vars
        const header = req.headers.authorization;
        security[role](req, null, header, function(err) {
            if (err) {
                res.status(err.statusCode).json(err);
            } else {
                next();
            }
        });
    };
};

const initialize = async function(app) {
    app.use(i18nMiddleware.handle(i18n));

    const models = generator.generate();
    app.use(modelsSupplyFn(models));
    app.locals.models = models;

    app.use('/auth/basic', authController.authenticateBasic);

    app.get('/authorizeds/me', authorization('self'), authorizedController.showCurrentUser);
    app.patch('/authorizeds/me', authorization('self'), authorizedController.updateCurrentUser);
    app.post('/authorizeds', authorization('admin'), authorizedController.createNewUser);
    app.get('/authorizeds/:id', authorization('admin'), authorizedController.getUser);
    app.get('/authorizeds', authorization('admin'), authorizedController.listUsers);
    app.patch('/authorizeds/:id', authorization('admin'), authorizedController.patchUser);

    app.use(errHandler);

    await models.sequelize.sync({ force: config.env === 'test' })
    return app;
};

const determineOrigin = function (origin) {
    if (origin === '*') {
        return '*';
    }
    const corsWhitelist = origin.split(' ');
    return function dofn(requestOrigin, callback) {
        const originStatus = corsWhitelist.indexOf(requestOrigin) > -1;
        const errorMsg = originStatus ? null : 'CORS Error';
        callback(errorMsg, originStatus);
    };
};

const newExpress = function() {
    const app = express();

    const jsonParser = bodyParser.json();

    const { origin } = config.get('cors');

    const corsOptions = {
        credentials: true,
        origin: determineOrigin(origin),
        allowedheaders: [
            'Accept',
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'X-HTTP-Allow-Override',
        ],
    };

    expressWinston.requestWhitelist.push('body');
    expressWinston.responseWhitelist.push('body');

    app.use(expressWinston.logger({
        winstonInstance: logger,
        msg: 'HTTP {{req.method}} {{req.url}}',
        expressFormat: true,
        colorize: true,
    }));

    app.use(cors(corsOptions));
    app.use(cookieParser());
    app.use(jsonParser);
    app.enable('trust proxy');
    app.use(passport.initialize());

    app.use((req, res, next) => {
        const isAuth = req.url.indexOf('/auth/basic') >= 0;
        const token = _.get(req, 'cookies.rr-jwt-token');
        if (token && !isAuth) {
            _.set(req, 'headers.authorization', `Bearer ${token}`);
        }
        next();
    });

    return app;
};

const generate = async function () {
    const app = newExpress();
    return initialize(app);
};

export default { generate };