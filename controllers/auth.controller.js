import passport from 'passport';
import passportHttp from 'passport-http';
import config from 'config';

import tokener from '../lib/tokener.js';
import * as shared from './shared.js';

const basicStrategy = function (req, username, password, done) {
    req.models.auth.authenticateUser(username, password)
        .then((user) => done(null, user))
        .catch((err) => done(err));
};

passport.use(new passportHttp.BasicStrategy({ passReqToCallback: true }, basicStrategy));

const authenticate = passport.authenticate('basic', {
    session: false,
    failWithError: true,
});

export function authenticateBasic(req, res, next) {
    authenticate(req, res, (err) => {
        if (err) {
            const json = shared.errToJSON(err, req.i18n);
            return res.status(401).json(json);
        }
        try {
            const token = tokener.createJWT(req.user);
            const cookieName = config.get('cookieName');
            if (!config.jwt.jwtTokenExpirationMinutes) {
                res.cookie(cookieName, token, { httpOnly: true });
            } else {
                res.cookie(cookieName, token, { httpOnly: true, maxAge: 1000 * 60 * config.jwt.jwtTokenExpirationMinutes });
            }
            return res.status(200).json({});
        } catch (err) {
            next(err);
        }
    });
}
