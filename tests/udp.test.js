const chai = require('chai');
const chaiHttp = require('chai-http');
const users = require('../examples/users');
const balances = require('../examples/balances');

chai.use(chaiHttp);

const { expect, request } = chai;

describe('udp', () => {
  let app;

  before(async () => {
    users.udp.services = {
      balances: [
        'localhost:5000',
        'localhost:5001',
        'localhost:5002',
      ],
    };

    await Promise.all([
      balances.udp.listen(5000),
      balances.udp.listen(5001),
      balances.udp.listen(5002),
    ]);

    app = users.app.listen(5010);
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
