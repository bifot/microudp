const dgram = require('dgram');
const roundround = require('roundround');
const { deserializeMessage, serializeMessage, toArray, createID } = require('./helpers');

class Client {
  constructor(options) {
    this.services = options.services;
    this.requests = new Map();
    this.sockets = new Map();

    this.init();
  }

  ask(event, data, options = { attempts: 5, timeout: 5000 }) {
    const [service, action] = event.split('.');
    const socket = this.sockets.get(service);
    const mock = this.responses && this.responses[service] && this.responses[service][action];

    if (mock) {
      return typeof mock === 'function' ? mock(data) : mock;
    }

    if (!socket) {
      throw new Error(`Socket for ${service} service not found`);
    }

    const emit = (index = 1) => {
      if (index === options.attempts) {
        return;
      }

      return socket(action, data, options)
        .catch(err => console.error(err) || emit(index + 1));
    };

    return emit();
  }

  mock(responses) {
    this.responses = responses;

    return this;
  }

  middleware() {
    return (...args) => {
      if (args.length === 3) {
        args[0].udp = this;
        args[1].udp = this;

        return args[2]();
      }

      args[0].udp = this;

      return args[1]();
    };
  }

  init() {
    const socket = dgram.createSocket('udp4');

    socket.on('message', (message) => {
      const json = deserializeMessage(message);

      if (!json) {
        console.error(new Error('Incoming message is invalid'));

        return;
      }

      const { data, id } = json;
      const request = this.requests.get(id);

      if (!request) {
        console.error(new Error('Promise is not found for this request'));

        return;
      }

      const { resolve, timer } = request;

      clearTimeout(timer);
      resolve(data);

      this.requests.delete(id);
    });

    Object.entries(this.services).forEach(([name, address]) => {
      const next = roundround(
        toArray(address).map((address) => {
          const [host, port] = address.split(':');

          return {
            host,
            port,
          };
        }),
      );

      this.sockets.set(name, (action, data, options) => {
        let resolve;
        let reject;

        const { host, port } = next();
        const id = createID();

        const promise = new Promise((res, rej) => {
          resolve = res;
          reject = rej;
        });

        this.requests.set(id, {
          resolve,
          timer: options.timeout && setTimeout(() => {
            reject(new Error(`Request for ${name} service is timed out`));
            this.requests.delete(id);
          }, options.timeout),
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
      });
    });

    return this;
  }
}

module.exports = Client;
