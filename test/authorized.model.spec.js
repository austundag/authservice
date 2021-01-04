import chai from 'chai';
import generator from '../models/generator.js';

const { expect } = chai;

describe('authorized unit', async function authorizedUnit() {
    let models;
    let authorized;

    before(async function initialization() {
        models = generator.generate();
        return models.sequelize.sync({ force: true });
    });

    it('add authorized', async function addAuthorized() {
        authorized = await models.User.create({
            username: 'janedoe',
            email: 'janedoe@gmail.com',
            password: 'dddddddddd',
            role: 'admin',
            birthday: new Date(1980, 6, 20),
        });
    });

    it('get authorized', async function getAuthorized () {
        const id = authorized.id;
        const actual = await models.User.findByPk(id, {
            raw: true,
            attributes: ['id', 'username', 'email', 'password'],
        });

        console.log(actual);
        expect(actual.username).to.equal('janedoe');
    });
});
