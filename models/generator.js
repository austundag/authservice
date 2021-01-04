import sequelize from 'sequelize';
import config from 'config';

import Authorized from './user.model.js';
import UserDAO from './user.dao.js';
import AuthDAO from './auth.dao.js';

import logger from '../logger.js';

const { Sequelize, Model } = sequelize;

const generate = function() {
    const logging = (message) => logger.info(message);
    const options = Object.assign({ logging }, config.get('db.options'));
 
    const sequelize = new Sequelize(options);
    const User = Authorized({ sequelize, Sequelize });

    return {
        sequelize,
        User,
        user: new UserDAO({ sequelize, User }),
        auth: new AuthDAO({ sequelize, User }),
    }
};

export default {
    generate,
};
