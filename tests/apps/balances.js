const MicroUDP = require('../../src');

const udp = new MicroUDP();

udp.on('get', (meta) => {
  return {
    amount: meta.userId === 1 ? 1000 : 10,
  };
});

udp.listen(process.env.UDP_PORT);
