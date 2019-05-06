module.exports = (message) => {
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
