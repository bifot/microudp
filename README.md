# ms-udp

Solution for communication between services using UDP protocol with build-in auto-retry & round-robin balancing. 🔬

## Install

```sh
$ npm i ms-udp -S
```

## Tests

```sh
$ npm test
```

## Examples

[There are some simple examples](examples).

## API

### UDP

#### .constuctor(options)

* `options` <?[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>
  * `services` <[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) / [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)> Available services to send request
  * `timeout` <[?number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type)> Timeout for outgoing request in ms *(default: 5000)*

This method creates instance of UDP class.

```js
const udp = new UDP({
  services: {
    balances: '127.0.0.1:4000',
    orders: '127.0.0.1:4001',
  },
  timeout: 5000,
});
```

#### .on(event, callback)

* `event` <[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)> Event name
* `callback` <[function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)> Event callback

This method creates action.

```js
const { Users } = require('./api/mongodb');

udp.on('check_user_level', async (data) => {
  const { level } = await Users.findOne({
    userId: data.id,
  });
  
  return level;
});
```

#### .ask(event, data)

* `event` <[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)> Event name in format `<service_name>.<action>`
* `data` <[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)> Event data
* `options` <[?Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)> Request options
  * `attempts` <[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type)> Maximum number of attempts *(default: 5)*

This method asks other microservice for something.

```js
const express = require('express');
const UDP = require('ms-udp');

const app = express();
const udp = new UDP({
  services: {
    balances: '127.0.0.1:4000',
  },
});

app.use(udp.middleware());

app.get('/', async (req, res) => {
  const response = await req.udp.ask('balances.get', {
    id: req.query.id,
  });
  
  if (!response) {
    res.status(404);
    res.end('Not Found.');
    
    return;
  }
  
  res.json({
    amount: response.amount,
  });
});

app.listen(3000);
```

#### .middleware()

This method returns middleware for Koa or Express.

#### .emit(event, data)

* `event` <[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)> Event name
* `data` <[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)> Event data

This method emits local event.

```js
...


udp.on('ping', () => 'pong');

app.get('/ping', (req, res) => {
  res.end(req.udp.emit('ping')); // 'pong'
});

...
``` 

#### .listen(port)

* `port` <[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type)>

This method starts listening needed port.
