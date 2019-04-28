const chai = require('chai');
const chaiHttp = require('chai-http');
const users = require('../examples/users');
const balances = require('../examples/balances');

chai.use(chaiHttp);

const { expect, request } = chai;

describe('udp', () => {
  let app;

  before(async () => {
    await Promise.all([
      users.udp.createSockets(),
      balances.udp.listen(process.env.BALANCES_PORT),
    ]);

    app = users.app.listen(process.env.USERS_PORT);
  });

  it('should get response', async () => {
    const { status, body } = await request(app).get('/');

    expect(status).to.be.equal(200);
    expect(body).to.be.deep.equal({
      id: 1,
      name: 'Mikhail Semin',
      hobbies: ['Node.js', 'Football'],
      balance: 1000,
    });
  });
});
