var express = require('express');
var router = express.Router();
var redis = require("redis");

/* GET home page. */
router.get('/', function(req, res, next) {
  var client = getRedis();
  client.hgetall("newman-web-collections", function (err, reply) {
    if (err) {
      return next(err)
    }
    var cs = [];
    for (var key in reply) {
      var obj = JSON.parse(reply[key]);
      cs.push(obj);
    }
    res.render('home', {collections: cs, page: 'home'})
  });
});

module.exports = router;
