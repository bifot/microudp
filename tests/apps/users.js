const express = require('express');
const TCP = require('../../src');

const app = express();
const tcp = new TCP({
  services: {
    balances: process.env.BALANCES_TCP_ADDRESS,
  },
});

app.get('/', async (req, res) => {
  const user = {
    id: 1,
    name: 'Mikhail Semin',
    hobbies: ['Node.js', 'Football'],
  };

  const { balance } = await tcp.ask('balances.get', {
    userId: user.id,
  });

  if (balance) {
    user.balance = balance;
  }

  res.json(user);
});

app.listen(process.env.HTTP_PORT);
tcp.listen(process.env.TCP_PORT);
