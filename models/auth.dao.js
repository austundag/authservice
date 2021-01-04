import sequelize from 'sequelize';
import afssequelize from 'afssequelize'

import AuthError from '../lib/auth-error.js';

const { Base } = afssequelize;

const { Sequelize: { Op } } = sequelize;

export default class AuthDAO extends Base {
    getUser({ id, username }) {
        const { User } = this.db;
        return User.findOne({
            raw: true,
            where: { id, originalUsername: username },
            attributes: ['id', 'username', 'email', 'role'],
        });
    }

    authenticateUser(username, password) {
        const { User } = this.db;
        const { sequelize } = this.db;
        return User.findOne({
            where: {
                [Op.or]: [
                    { username },
                    {
                        [Op.and]: [{
                            username: sequelize.fn('lower', sequelize.col('email')),
                        }, {
                            username: sequelize.fn('lower', username),
                        }],
                    },
                ],
            },
        })
            .then((user) => {
                if (user) {
                    if (user.role === 'import') {
                        return AuthError.reject('authenticationImportedUser');
                    }
                    return user.authenticate(password)
                        .then(() => ({
                            id: user.id,
                            originalUsername: user.originalUsername,
                        }));
                }
                return AuthError.reject('authenticationError');
            });
    }
};
