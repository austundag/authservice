/* eslint no-console: 0 */

import config from 'config';

import appgen from './app-generator.js';

appgen.generate()
    .then((app) => {
        const port = config.get('port');
        app.listen(port, () => {
            console.log('Server started at ', config.port);
        });
    })
    .catch((err) => { 
        console.log('Server failed to start due to error: %s', err);
    });
