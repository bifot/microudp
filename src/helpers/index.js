module.exports.deserializeMessage = (message) => {
  const content = message.toString();

  if (!content) {
    return;
  }

  let json;

  try {
    json = JSON.parse(content);
  } catch (err) {
    console.error('Cannot parse received message', content, err);
  }

  return json;
};

module.exports.serializeMessage = (message) => {
  let json;

  try {
    json = JSON.stringify(message);
  } catch (err) {
    console.error('Cannot stringify message', message, err);
  }

  return Buffer.from(json || message);
};
