const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    (req.connection && req.connection.socket ? req.connection.socket.remoteAddress : null) ||
    'unknown';
};

const extractBearerToken = (req) => {
  const auth = req.headers?.authorization || '';
  if (!auth) return null;
  if (auth.startsWith('Bearer ')) return auth.replace('Bearer ', '').trim();
  return auth.trim();
};

module.exports = { getClientIP, extractBearerToken };