module.exports = (message) => {
  let json;

  try {
    json = JSON.stringify(message);
  } catch (err) {
    console.error('Cannot stringify message', message, err);
  }

  return Buffer.from(json || message);
};
