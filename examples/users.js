const express = require('express');
const UDP = require('../src');

const app = express();
const udp = new UDP({
  services: {
    balances: process.env.BALANCES_UDP_ADDRESS,
  },
  timeout: 1000,
});

app.use(udp.middleware());

app.get('/', async (req, res) => {
  const user = {
    id: 1,
    name: 'Mikhail Semin',
    hobbies: ['Node.js', 'Football'],
  };

  const balance = await req.udp.ask('balances.get', {
    userId: user.id,
  });

  if (balance) {
    user.balance = balance.amount;
  }

  res.json(user);
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(process.env.HTTP_PORT);
  udp.listen(process.env.UDP_PORT);
}

module.exports = {
  app,
  udp,
};
