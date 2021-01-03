import sequelize from 'sequelize';
import config from 'config';

const { Sequelize, Model } = sequelize;

const generate = function() {
    const sequelize = new Sequelize(config.get('db.options'));

    class User extends Model {}
    User.init({
        username: Sequelize.STRING,
        birthday: Sequelize.DATE
    }, {
        sequelize,
        modelName: 'user'
    });

    return {
        sequelize,
        User,
    }
};

export default {
    generate,
};
