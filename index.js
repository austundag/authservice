/* eslint no-console: 0 */

import config from './config';

import app from './app';
import appgen from './app-generator';

appgen.initialize(app, {}, (err) => {
    if (err) {
        console.log('Server failed to start due to error: %s', err);
    } else {
        app.listen(config.port, () => {
            console.log('Server started at ', config.port);
        });
    }
});

export default app;
