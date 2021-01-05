import _ from 'lodash';

const oppositeCase = function oppositeCase(input) {
    let result = '';
    _.range(input.length).forEach((index) => {
        const ch = input.charAt(index);
        if (ch === ch.toLowerCase()) {
            result += ch.toUpperCase();
        } else {
            result += ch.toLowerCase();
        }
    });
    return result;
};

export default {
    oppositeCase,
};
