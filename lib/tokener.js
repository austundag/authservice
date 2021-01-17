import util from 'util';
import jwt from 'jsonwebtoken';

import config from 'config';

const proxy = (token, callback) => {
    jwt.verify(token, config.jwt.secret, {}, callback);
};

const createJWT = function createJWT({ id, originalUsername }) {
    const { secret } = config.jwt;
    return jwt.sign({ id, username: originalUsername }, secret, { expiresIn: '30d' });
};
  
const verifyJWT = util.promisify(proxy, { context: jwt });

export default { createJWT, verifyJWT };