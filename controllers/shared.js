import afssequelize from 'afssequelize';

import { errToJSON as errToJSONImpl } from '../lib/jsutil.js';
import AuthError from '../lib/auth-error.js';

const sequelizeErrorMap = {
    SequelizeUniqueConstraintError: {
        'lower(email)': 'uniqueEmail',
        generic: 'genericUnique',
    },
};

const { Sequelize } = afssequelize;

const transformSequelizeError = function transformSequelizeError(err) {
    const topSpecification = sequelizeErrorMap[err.name];
    if (topSpecification) {
        const { fields } = err;
        if (fields && (typeof fields === 'object')) {
            const key = Object.keys(fields)[0];
            const code = topSpecification[key];
            if (code) {
                return new AuthError(code);
            }
            const genericCode = topSpecification.generic;
            if (genericCode) {
                const value = fields[key];
                return new AuthError(genericCode, key, value);
            }
        }
    }
    return err;
};

export const errToJSON = function errToJSON(err, i18n) {
    let localErr = err;
    if (localErr instanceof Sequelize.Error) {
        localErr = transformSequelizeError(err);
    }
    if (localErr instanceof AuthError) {
        const message = localErr.getMessage(i18n);
        const json = errToJSONImpl(localErr);
        json.message = message;
        return json;
    }
    return errToJSONImpl(localErr);
};

export function handleError(req, res) {
    return function handleErrorInner(err) {
        const json = errToJSON(err, req.i18n);
        if (err instanceof AuthError) {
            const statusCode = err.statusCode || 400;
            return res.status(statusCode).json(json);
        }
        if (err instanceof Sequelize.Error) {
            return res.status(400).json(json);
        }
        return res.status(500).json(json);
    };
};
