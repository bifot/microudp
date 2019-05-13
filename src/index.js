const dgram = require('dgram');
const roundround = require('roundround');
const debug = require('debug')('ms-udp');
const { deserializeMessage, serializeMessage, toArray, createID } = require('./helpers');

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

  async ask(event, data, options = { attempts: 5 }) {
    const [service, action] = event.split('.');
    const socket = this.sockets.get(service);

    if (!socket) {
      throw new Error(`Socket for ${service} service not found`);
    }

    const send = async (attempt = 0) => {
      if (attempt === options.attempts) {
        return null;
      }

      debug(`requesting ${event} in ${attempt + 1} time`);

      return socket.send(action, data)
        .catch(() => send(attempt + 1));
    };

    return send();
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
        send: (action, data) => {
          let resolve;
          let reject;

          const { host, port } = next();
          const id = createID();

          debug(`sending request to ${host}:${port}`);

          const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
          });

          this.requests.set(id, {
            resolve,
            timer: setTimeout(() => {
              reject();
              this.requests.delete(id);
            }, this.timeout),
          });

          socket.send(serializeMessage({
            event: action,
            data,
            id,
          }), port, host, (err) => {
            if (err) {
              console.error('Could not send message', err);
            }
          });

          return promise;
        },
      });
    });

    debug('sockets created');

    this.socketsCreated = true;
  }

  async listen(port, host) {
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
      }), info.port, info.address, (err) => {
        if (err) {
          console.error('Could not send message', err);
        }
      });

      debug('sent response');
    });

    socket.bind(port, host);

    return socket;
  }
}

module.exports = UDP;
