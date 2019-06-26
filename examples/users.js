const express = require('express');
const { Client } = require('../src');

const app = express();
const client = new Client({
  services: {
    balances: process.env.BALANCES_ADDRESS,
  },
});

app.use(client.middleware());

app.get('/', async (req, res) => {
  const user = {
    id: 1,
    name: 'Mikhail Semin',
    hobbies: ['Node.js', 'Football'],
  };

  const balance = await req.udp.ask('balances.get', {
    userId: user.id,
  });

  res.json({
    ...user,
    balance,
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(process.env.APP_PORT);
}

module.exports = app;
