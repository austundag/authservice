import sequelize from 'sequelize';

const { Sequelize, Model } = sequelize;

const generate = function() {
    const sequelize = new Sequelize('recreg', 'postgres', 'postgres', {
        dialect: 'postgres',
        host: 'localhost'
    });

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
