import axios from 'axios';
import config from 'config';
import AuthError from '../lib/auth-error.js';

import * as shared from './shared.js';

export async function resetToken(req, res) {
    const url = config.get('hook.resetPassword.url');
    if (!url) {
        const err = new AuthError('resetPasswordHookMissing');
        return shared.handleError(req, res)(err);
    }

    const { email } = req.body;
    try {
        const result = await req.models.user.resetPasswordToken(email)
        const axiosConfig = {
            url,
            method: 'POST',
            header: { 'Content-Type': 'application/json' },
            data: result,
        };
        const response = await axios.request(axiosConfig);
        if (response.status < 400) {
            return res.status(204).end();
        }
        const err = new AuthError('resetPasswordServerError');
        shared.handleError(req, res)(err);
    } catch (err) {
        shared.handleError(req, res)(err);
    }
}
