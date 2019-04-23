const TCP = require('../../src');

const tcp = new TCP();

tcp.on('get', (meta) => {
  return {
    balance: meta.userId === 1 ? 1000 : 10,
  };
});

tcp.listen(process.env.TCP_PORT);
