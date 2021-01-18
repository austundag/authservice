/* eslint no-param-reassign: 0, max-len: 0 */

import chai from 'chai';
import _ from 'lodash';
import moment from 'moment';

const { expect } = chai;

const comparator = {
    createdAt(server) {
        const compareDateTime = moment().subtract(2, 'second');
        const createdDateTime = moment(server.createdAt);
        expect(createdDateTime.isAfter(compareDateTime)).to.equal(true);
    },
    user(client, server) {
        const expected = _.cloneDeep(client);
        expected.id = server.id;
        delete expected.password;
        if (!Object.prototype.hasOwnProperty.call(expected, 'role')) {
            expected.role = 'participant';
        }
        if (!expected.username) {
            expected.username = expected.email.toLowerCase();
        }
        this.createdAt(server);
        expected.createdAt = server.createdAt;
        expect(server).to.deep.equal(expected);
    },
};

export default comparator;
