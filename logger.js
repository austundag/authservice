import winston from 'winston';
import config from 'config';

export default winston.createLogger({
    transports: [
        new winston.transports.Console(),
    ],
    level: config.get('logging.level'),
    format: winston.format.json(),
});
