const dgram = require('dgram');
const nanoid = require('nanoid');
const { deserializeMessage, serializeMessage } = require('./helpers');

class UDP {
  constructor(options = {}) {
    this.services = options.services || {};

    this.actions = new Map();
    this.sockets = new Map();
    this.promises = new Map();
  }

  on(event, callback) {
    this.actions.set(event, callback);

    return this;
  }

  ask(event, data) {
    const [service, action] = event.split('.');
    const socket = this.sockets.get(service);

    if (!socket) {
      return;
    }

    let resolve;

    const id = nanoid();
    const promise = new Promise(r => (resolve = r));

    socket.send(serializeMessage({
      event: action,
      data,
      id,
    }));

    this.promises.set(id, resolve);

    return promise;
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

  async createSockets() {
    const socket = dgram.createSocket('udp4');

    socket.on('message', (message) => {
      const json = deserializeMessage(message);

      if (!json) {
        return;
      }

      const { data, id } = json;
      const resolve = this.promises.get(id);

      if (resolve) {
        resolve(data);
      }

      this.promises.delete(id);
    });

    Object.entries(this.services).forEach(([service, address]) => {
      const [host, port] = address.split(':');

      this.sockets.set(service, {
        send: (message) => {
          socket.send(message, port, host);
        },
      });
    });

    this.socketsCreated = true;
  }

  async listen(port) {
    if (!this.socketsCreated) {
      await this.createSockets();
    }

    const socket = dgram.createSocket('udp4');

    socket.on('error', (err) => {
      console.log(err.stack);
    });

    socket.on('message', async (message, info) => {
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

      socket.send(serializeMessage({
        data: response,
        id,
      }), info.port, info.address);
    });

    socket.bind(port);
  }
}

module.exports = UDP;
