import i18next from 'i18next';
import Backend from 'i18next-node-fs-backend';
import middleware from 'i18next-express-middleware';

import logger from './logger.js';

const loggerPlugin = {
    type: 'logger',
    log(args) {
        logger.log('debug', args);
    },
    warn(args) {
        logger.log('warn', args);
    },
    error(args) {
        logger.log('error', args);
    },
};

i18next.use(Backend).use(middleware.LanguageDetector).use(loggerPlugin).init({
    initImmediate: false,
    fallbackLng: 'en',
    backend: {
        loadPath: 'locales/{{lng}}_{{ns}}.json',
    },
    detection: {
        order: ['querystring', 'header'],
        lookupQuerystring: 'language',
        lookupHeader: 'accept-language',
        caches: false,
    },
});

export default i18next;
