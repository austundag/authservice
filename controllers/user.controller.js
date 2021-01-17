import _ from 'lodash';

import * as shared from './shared.js';

import * as sendMail from '../lib/email.js';

export function createNewUser(req, res) {
    const newUser = req.body;
    if (!newUser.role) {
        newUser.role = 'participant';
    }
    return req.models.user.createUser(newUser)
        .then(({ id }) => {
            // sendMail(newUser, 'new_contact', {});
            res.status(201).json({ id });
        })
        .catch(shared.handleError(req, res));
};

export function getUser(req, res) {
    const id = req.params.id;
    req.models.user.getUser(id)
        .then((result) => res.status(200).json(result))
        .catch(shared.handleError(req, res));
};

export function patchUser(req, res) {
    const id = req.params.id;
    req.models.user.updateUser(id, req.body)
        .then(() => res.status(204).end())
        .catch(shared.handleError(req, res));
};

export function listUsers(req, res) {
    const role = req.query.role;
    const options = role ? { role } : {};
    req.models.user.listUsers(options)
        .then((users) => res.status(200).json(users))
        .catch(shared.handleError(req, res));
};

export function showCurrentUser(req, res) {
    const currentUser = _.omitBy(req.user, _.isNil);
    res.status(200).json(currentUser);
};

export function updateCurrentUser(req, res) {
    req.models.user.updateUser(req.user.id, req.body)
        .then(() => res.status(204).end())
        .catch(shared.handleError(req, res));
};

export function resetPassword(req, res) {
    req.models.user.resetPassword(req.body.token, req.body.password)
        .then(() => res.status(204).end())
        .catch(shared.handleError(req, res));
};
