// default module file for /middlewares directory

const authorization = require('./authorization');
const error = require('./error');
const validation = require('./validation');

module.exports = {
  authorization,
  error,
  validation,
};
