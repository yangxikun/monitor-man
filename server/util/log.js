const log4js = require('log4js');

const _log = {
  level: process.env.LOG_LEVEL,
  get: function (name) {
    const logger = log4js.getLogger(name);
    logger.level = 'debug';
    if (this.level) {
      logger.level = this.level;
    }
    return logger
  }
};

module.exports = _log;
