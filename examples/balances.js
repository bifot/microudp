const { Server } = require('../src');

const server = new Server();

server.on('get', (ctx) => {
  ctx.reply(ctx.payload.userId * 100);
});

module.exports = server.listen(process.env.APP_PORT);
