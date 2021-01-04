import sequelize from 'sequelize';
import config from 'config';

import Authorized from './user.model.js';
import UserDAO from './user.dao.js';

const { Sequelize, Model } = sequelize;

const generate = function() {
    const sequelize = new Sequelize(config.get('db.options'));
    const User = Authorized({ sequelize, Sequelize });

    return {
        sequelize,
        User,
        user: new UserDAO({ sequelize, User }),
    }
};

export default {
    generate,
};
