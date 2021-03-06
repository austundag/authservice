import axios from 'axios';
import _ from 'lodash';
import config from 'config';

import * as shared from './shared.js';
import AuthError from '../lib/auth-error.js';

export async function createNewUser(req, res) {
    const newUser = req.body;
    if (!newUser.role) {
        newUser.role = 'participant';
    }
    try {
        const { id } = await req.models.user.createUser(newUser);
        const url = config.get('hook.create.url');
        if (url) {
            const additionalData = config.get('hook.create.additionalData');
            const data = Object.assign({}, newUser, additionalData);
            const axiosConfig = {
                url,
                method: 'POST',
                header: { 'Content-Type': 'application/json' },
                data,
            };
            await axios.request(axiosConfig);
        }
        res.status(201).json({ id });
    } catch(err) {
        shared.handleError(req, res)(err);
    }
}

export function getUser(req, res) {
    const id = req.params.id;
    req.models.user.getUser(id)
        .then((result) => res.status(200).json(result))
        .catch(shared.handleError(req, res));
}

export function patchUser(req, res) {
    const id = req.params.id;
    req.models.user.updateUser(id, req.body)
        .then(() => res.status(204).end())
        .catch(shared.handleError(req, res));
}

export function listUsers(req, res) {
    const role = req.query.role;
    const options = role ? { role } : {};
    req.models.user.listUsers(options)
        .then((users) => res.status(200).json(users))
        .catch(shared.handleError(req, res));
}

export function showCurrentUser(req, res) {
    const currentUser = _.omitBy(req.user, _.isNil);
    res.status(200).json(currentUser);
}

export function updateCurrentUser(req, res) {
    req.models.user.updateUser(req.user.id, req.body)
        .then(() => res.status(204).end())
        .catch(shared.handleError(req, res));
}

export function resetPassword(req, res) {
    const { token, password } = req.body;
    if (!token) {
        const err = new AuthError('invalidOrExpiredPWToken');
        return shared.handleError(req, res)(err);
    }

    req.models.user.resetPassword(token, password)
        .then((user) => {
            res.status(204).end()
        })
        .catch(shared.handleError(req, res));
}
