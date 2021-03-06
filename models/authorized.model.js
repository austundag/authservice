import util from 'util';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import moment from 'moment';
import config from 'config';

import AuthError from '../lib/auth-error.js';

export default function Authorized({ sequelize, Sequelize, schema = 'public' }) {
    const bccompare = util.promisify(bcrypt.compare, {
        context: bcrypt,
    });
    const bchash = util.promisify(bcrypt.hash, {
        context: bcrypt,
    });
    const randomBytes = util.promisify(crypto.randomBytes, {
        context: crypto,
    });

    const tableName = 'authorized';
    const modelName = `${schema}_${tableName}`;
    const Table = sequelize.define(modelName, {
        username: {
            type: Sequelize.TEXT,
            unique: true,
            validate: {
                notEmpty: true,
            },
            allowNull: false,
        },
        email: {
            type: Sequelize.TEXT,
            validate: {
                isEmail: true,
            },
            allowNull: false,
        },
        password: {
            type: Sequelize.TEXT,
            validate: {
                notEmpty: true,
            },
            allowNull: false,
        },
        role: {
            type: Sequelize.ENUM('admin', 'participant', 'clinician', 'import'),
            allowNull: false,
        },
        originalUsername: {
            type: Sequelize.TEXT,
            field: 'original_username',
            allowNull: true,
        },
        resetPasswordToken: {
            unique: true,
            type: Sequelize.STRING,
            field: 'reset_password_token',
        },
        resetPasswordExpires: {
            type: Sequelize.DATE,
            field: 'reset_password_expires',
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
            defaultValue: sequelize.literal('NOW()'),
        },
        updatedAt: {
            type: Sequelize.DATE,
            field: 'updated_at',
        },
        deletedAt: {
            type: Sequelize.DATE,
            field: 'deleted_at',
        },
        firstname: {
            type: Sequelize.TEXT,
        },
        lastname: {
            type: Sequelize.TEXT,
        },
        institution: {
            type: Sequelize.TEXT,
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deletedAt: 'deletedAt',
        paranoid: true,
        indexes: [{
            name: 'registry_user_lower_email_key',
            unique: true,
            fields: [sequelize.fn('lower', sequelize.col('email'))],
        }],
        hooks: {
            afterSync(options) {
                if (options.force) {
                    const role = 'admin';
                    const user = { role, ...config.get('superUser') };
                    user.originalUsername = user.username;
                    return this.create(user);
                }
                return null;
            },
            beforeCreate(user) {
                return user.updatePassword();
            },
            beforeUpdate(user) {
                if (user.changed('password')) {
                    return user.updatePassword();
                }
                return null;
            },
        },
    });

    Table.prototype.authenticate = function authenticate(password) {
        return bccompare(password, this.password)
            .then((result) => {
                if (!result) {
                    throw new AuthError('authenticationError');
                }
            });
    };


    Table.prototype.updatePassword = function updatePassword() {
        return bchash(this.password, config.crypt.hashrounds)
            .then((hash) => {
                this.password = hash;
            });
    };

    Table.prototype.updateResetPWToken = function updateResetPWToken() {
        return randomBytes(config.crypt.resetTokenLength)
            .then((buf) => buf.toString('hex'))
            .then((token) => randomBytes(config.crypt.resetPasswordLength)
                .then((passwordBuf) => ({
                    token,
                    password: passwordBuf.toString('hex'),
                })))
            .then((result) => {
                this.resetPasswordToken = result.token;
                this.password = result.password;
                const m = moment.utc();
                m.add(config.crypt.resetExpires, config.crypt.resetExpiresUnit);
                this.resetPasswordExpires = m.toISOString();
                return this.save()
                    .then(() => result.token);
            });
    };

    return Table;
}
