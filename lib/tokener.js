import jwt from 'jsonwebtoken';

import config from 'config';

const createJWT = function createJWT({ id, originalUsername }) {
    const { secret } = config.jwt;
    return jwt.sign({ id, username: originalUsername }, secret, { expiresIn: '30d' });
};
  
export default { createJWT };