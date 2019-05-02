const dgram = require('dgram');
const nanoid = require('nanoid');
const roundround = require('roundround');
const debug = require('debug')('ms-udp');
const { deserializeMessage, serializeMessage, toArray } = require('./helpers');

class UDP {
  constructor(options = {}) {
    this.services = options.services || {};
    this.timeout = options.timeout || 5000;

    this.actions = new Map();
    this.sockets = new Map();
    this.requests = new Map();
  }

  on(event, callback) {
    this.actions.set(event, callback);

    return this;
  }

  async ask(event, data) {
    const [service, action] = event.split('.');
    const socket = this.sockets.get(service);

    if (!socket) {
      throw new Error(`Socket for ${service} service not found`);
    }

    let resolve;

    const id = nanoid();
    const promise = new Promise(r => (resolve = r));

    await socket.send(serializeMessage({
      event: action,
      data,
      id,
    }));

    debug('sent request');

    this.requests.set(id, {
      resolve,
      timer: setTimeout(() => {
        this.requests.delete(id);
        resolve(null);
      }, this.timeout),
    });

    return promise;
  }

  emit(event, data) {
    const action = this.actions.get(event);

    if (!action) {
      return;
    }

    return action(data);
  }

  middleware() {
    return async (...args) => {
      if (!this.socketsCreated) {
        await this.createSockets();
      }

      if (args.length === 3) {
        args[0].udp = this;
        args[1].udp = this;

        return args[2]();
      }

      args[0].udp = this;

      return args[1]();
    };
  }

  async createSockets() {
    debug('creating sockets');

    const socket = dgram.createSocket('udp4');

    socket.on('message', (message) => {
      debug('received response');

      const json = deserializeMessage(message);

      if (!json) {
        return;
      }

      const { data, id } = json;
      const request = this.requests.get(id);

      if (!request) {
        return;
      }

      const { resolve, timer } = request;

      clearTimeout(timer);
      resolve(data);

      this.requests.delete(id);
    });

    Object.entries(this.services).forEach(([service, addresses]) => {
      const next = roundround(
        toArray(addresses).map((address) => {
          const [host, port] = address.split(':');

          return {
            host,
            port,
          };
        }),
      );

      this.sockets.set(service, {
        send: (message) => new Promise((resolve, reject) => {
          const { host, port } = next();

          socket.send(message, port, host, (err, reply) => {
            if (err) {
              reject(err);
            } else {
              resolve(reply);
            }
          });
        }),
      });
    });

    debug('sockets created');

    this.socketsCreated = true;
  }

  async listen(port, address) {
    if (!this.socketsCreated) {
      await this.createSockets();
    }

    const socket = dgram.createSocket('udp4');

    socket.on('error', (err) => {
      console.log(err.stack);
    });

    socket.on('message', async (message, info) => {
      debug('received request');

      const json = deserializeMessage(message);

      if (!json) {
        return;
      }

      const { event, data, id } = json;
      const action = this.actions.get(event);

      if (!action) {
        return;
      }

      const response = await action(data);

      await socket.send(serializeMessage({
        data: response,
        id,
      }), info.port, info.address);

      debug('sent response');
    });

    socket.bind(port, address);
  }
}

module.exports = UDP;
