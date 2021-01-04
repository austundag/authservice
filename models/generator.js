import sequelize from 'sequelize';
import config from 'config';

import Authorized from './user.model.js';

const { Sequelize, Model } = sequelize;

const generate = function() {
    const sequelize = new Sequelize(config.get('db.options'));
    const User = Authorized({ sequelize, Sequelize });

    return {
        sequelize,
        User,
    }
};

export default {
    generate,
};
