import chai from 'chai';
import _ from 'lodash';

// import errHandler from './err-handler-spec';

const { expect } = chai;

export default class SharedSpec {
    constructor(generator) {
        this.generator = generator || new Generator();
        // this.throwingHandler = errHandler.throwingHandler;
    }

    initModels(models) {
        this.models = models;
    }

    setUpFn(force = true) {
        const m = this.models;
        return function setUp() {
            return m.sequelize.sync({ force });
        };
    }

    expectedErrorHandler(code, ...params) { // eslint-disable-line class-methods-use-this
        return errHandler.expectedErrorHandlerFn(code, ...params);
    }

    expectedSeqErrorHandler(name, fields) { // eslint-disable-line class-methods-use-this
        return errHandler.expectedSeqErrorHandlerFn(name, fields);
    }

    sanityEnoughUserTested(hxUser) { // eslint-disable-line class-methods-use-this
        return function sanityEnoughUserTested() {
            const userCount = hxUser.length();
            const counts = _.range(userCount).reduce((r, index) => {
                if (hxUser.client(index).username) {
                    r.username += 1;
                } else {
                    r.email += 1;
                }
                return r;
            }, { username: 0, email: 0 });
            expect(counts.username).to.be.above(0);
            expect(counts.email).to.be.above(0);
        };
    }
}

