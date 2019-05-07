const chai = require('chai');
const chaiHttp = require('chai-http');
const users = require('../examples/users');
const balances = require('../examples/balances');

chai.use(chaiHttp);

const { expect, request } = chai;

describe('udp', () => {
  let app;
  let services;

  const test = async () => {
    const { status, body } = await request(app).get('/');

    expect(status).to.be.equal(200);
    expect(body).to.be.deep.equal({
      id: 1,
      name: 'Mikhail Semin',
      hobbies: ['Node.js', 'Football'],
      balance: 1000,
    });
  };

  before(async () => {
    users.udp.services = {
      balances: [
        'localhost:5000',
        'localhost:5001',
        'localhost:5002',
        'bad-host:5003',
      ],
    };

    services = await Promise.all([
      balances.udp.listen(5000),
      balances.udp.listen(5001),
      balances.udp.listen(5002),
    ]);

    app = users.app.listen(5010);
  });

  it('should get response simply', test);

  it('should get response when 2 services are dead', async () => {
    services[1].close();
    services[2].close();

    await test();
  });

  it('should get response when all services are dead', async () => {
    services[0].close();

    const { status, body } = await request(app).get('/');

    expect(status).to.be.equal(200);
    expect(body.balance).to.be.equal(undefined);
  });
});
