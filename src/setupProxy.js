const proxy = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(proxy('/socket', { target: 'ws://localhost:8000', ws: true }));
};