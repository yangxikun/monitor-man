const intervalIds = {
  get: function (key) {
    return intervalIds[key];
  },
  add: function (key, id, timestamp) {
    intervalIds[key] = {intervalId: id, ts: timestamp};
  },
  del: function (key) {
    delete intervalIds[key]
  },
  intervalIds: {}
};

module.exports = intervalIds;
