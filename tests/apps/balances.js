const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const MicroUDP = require('../../src');

const app = new Koa();
const router = new Router();
const udp = new MicroUDP();

udp.on('get', (data) => {
  return {
    amount: data.userId === 1 ? 1000 : 10,
  };
});

router.all('/', (ctx) => {
  ctx.body = ctx.udp.emit('get', {
    ...ctx.query,
    ...ctx.params,
    ...ctx.request.body,
  });
});

app.use(udp.middleware());
app.use(bodyParser());
app.use(router.routes());

app.listen(process.env.HTTP_PORT);
udp.listen(process.env.UDP_PORT);
