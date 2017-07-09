var intervalIds = {
  get: function (key) {
    return intervalIds[key];
  },
  add: function (key, id) {
    intervalIds[key] = id;
  },
  del: function (key) {
    delete intervalIds[key]
  },
  intervalIds: {}
};

module.exports = intervalIds;