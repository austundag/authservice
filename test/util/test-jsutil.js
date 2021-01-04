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

const findStanding = function findStanding(selections) {
    const result = [];
    selections.forEach((selection) => {
        const toBeRemoved = selection.map((r) => (r < 0 ? -r : r));
        const toBeInserted = selection.filter((r) => r >= 0);
        result.forEach((r) => _.pullAll(r, toBeRemoved));
        result.push(_.sortBy(toBeInserted));
    });
    return result;
};

const findRemoved = function findRemoved(selections) {
    const result = [];
    const actualResult = [];
    selections.forEach((selection, timeIndex) => {
        const toBeRemoved = selection.map((r) => (r < 0 ? -r : r));
        const toBeInserted = selection.filter((r) => r >= 0);
        result.forEach((r, index) => {
            const levelRemoved = _.intersection(r, toBeRemoved);
            _.pullAll(r, toBeRemoved);
            actualResult[index].push({ timeIndex, removed: levelRemoved });
        });
        result.push(_.sortBy(toBeInserted));
        actualResult.push([]);
    });
    return actualResult;
};

export default {
    oppositeCase,
};
