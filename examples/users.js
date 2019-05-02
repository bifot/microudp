const express = require('express');
const UDP = require('../src');

const app = express();
const udp = new UDP({
  services: {
    balances: [
      'localhost:5000',
      'localhost:5001',
    ],
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
  app.listen(4999);
}

module.exports = {
  app,
  udp,
};
