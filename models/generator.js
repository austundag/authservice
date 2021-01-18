import sequelize from 'sequelize';
import config from 'config';

import Authorized from './authorized.model.js';
import AuthorizedDAO from './authorized.dao.js';
import AuthDAO from './auth.dao.js';

import logger from '../logger.js';

const { Sequelize } = sequelize;

const generate = function() {
    const logging = (message) => logger.info(message);
    const options = Object.assign({ logging }, config.get('db.options'));
 
    const sequelize = new Sequelize(options);
    const User = Authorized({ sequelize, Sequelize });

    return {
        sequelize,
        User,
        user: new AuthorizedDAO({ sequelize, User }),
        auth: new AuthDAO({ sequelize, User }),
    }
};

export default {
    generate,
};
