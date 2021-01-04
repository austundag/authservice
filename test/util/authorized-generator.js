import _ from 'lodash';
import testJsutil from './test-jsutil.js';

export default class AuthorizedGenerator {
    constructor() {
        this.userIndex = -1;
    }

    newUser(override) {
        this.userIndex += 1;
        const { userIndex } = this;
        let username = 'uSeRnAmE';
        let email = 'eMaIl';
        if ((userIndex + 1) % 3 === 0) {
            username = testJsutil.oppositeCase(username);
            email = testJsutil.oppositeCase(email);
        }
        let user = {
            username: `${username}_${userIndex}`,
            password: `password_${userIndex}`,
            email: `${email}_${userIndex}@example.com`,
        };
        if ((userIndex + 1) % 2 === 0) {
            delete user.username;
        }
        if (override) {
            user = _.assign(user, override);
        }
        if (!user.role) {
            user.role = 'participant';
        }
        if (userIndex % 2 === 1) {
            user.firstname = `firstname_${userIndex}`;
            user.lastname = `lastname_${userIndex}`;
            user.institution = `institution_${userIndex}`;
        }
        return user;
    }
}
