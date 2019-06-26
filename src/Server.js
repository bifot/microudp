const dgram = require('dgram');
const Context = require('./Context');
const { deserializeMessage, serializeMessage } = require('./helpers');

class Server {
  constructor() {
    this.middlewares = [];
  }

  on(...args) {
    this.use(...args);

    return this;
  }

  use(...middlewares) {
    let event;

    if (typeof middlewares[0] === 'string') {
      event = middlewares.shift();
    }

    middlewares.forEach((fn) => {
      const index = this.middlewares.length;

      this.middlewares.push({
        event,
        fn: (ctx) => fn(ctx, () => this.next(ctx, index + 1)),
      })
    });

    return this;
  }

  next(ctx, index = 0) {
    const middleware = this.middlewares[index];

    if (!middleware) {
      return;
    }

    const { fn, event } = middleware;

    if (!event || event === ctx.request.event) {
      return fn(ctx);
    }

    return this.next(ctx, index + 1);
  }

  listen(...args) {
    const socket = dgram.createSocket('udp4');

    socket.on('error', (err) => {
      console.error(err.stack);
    });

    socket.on('message', async (message, info) => {
      const json = deserializeMessage(message);

      if (!json) {
        return;
      }

      const context = new Context(this, json);

      await this.next(context);

      await socket.send(serializeMessage({
        data: context.response,
        id: json.id,
      }), info.port, info.address, (err) => {
        if (err) {
          console.error('Could not send message', err);
        }
      });
    });

    socket.bind(...args);

    return this;
  }
}

module.exports = Server;
