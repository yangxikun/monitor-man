var express = require('express');
var router = express.Router();
var md5 = require('js-md5');

router.get('/', function(req, res) {
  var client = getRedis();
  client.hgetall('newman-web-handlers', function (err, reply) {
    if (err) { throw err; }
    var handlers = [];
    for (key in reply) {
      var obj = JSON.parse(reply[key]);
      handlers.push({
        id: key,
        name: obj.name,
        description: obj.description
      });
    }
    res.render('handler/list', {handlers: handlers, page: 'handler'});
  });
});

router.get('/create', function(req, res) {
  res.render('handler/create', {page: 'handler'});
});

router.get('/update/:id', function (req, res, next) {
  var client = getRedis();
  client.hget('newman-web-handlers', req.params.id, function (err, reply) {
    if (err) {
      next(err);
      return
    }
    var obj = JSON.parse(reply);
    obj.id = req.params.id;
    res.render('handler/update', {handler: obj, page: 'handler'})
  });
});

router.post('/update/:id', function (req, res) {
  req.checkBody('name', 'Invalid name').notEmpty();
  req.checkBody('description', 'Invalid description').notEmpty();
  req.checkBody('script', 'Invalid script').notEmpty();
  req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) {
      var err = new Error(JSON.stringify(result.array()));
      err.status = 400;
      next(err);
      return
    }
    var client = getRedis();
    client.hset('newman-web-handlers', req.params.id, JSON.stringify({name: req.body.name, description: req.body.description, script: req.body.script}), function (err, reply) {
      if (err) { throw err; }
    });
    res.redirect('/handler')
  });
});

router.delete('/:id', function (req, res) {
  var client = getRedis();
  client.hdel('newman-web-handlers', req.params.id, function (err, reply) {
    if (err) { throw err; }
  });
  res.send('')
});

router.post('/', function (req, res, next) {
  req.checkBody('name', 'Invalid name').notEmpty();
  req.checkBody('script', 'Invalid script').notEmpty();
  req.checkBody('description', 'Invalid description').notEmpty();
  req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) {
      var err = new Error(JSON.stringify(result.array()));
      err.status = 400;
      next(err);
      return
    }
    var client = getRedis();

    var hash = md5.create();
    hash.update(req.body.name);
    var id = hash.hex() + (new Date()).getTime();
    client.hset('newman-web-handlers', id, JSON.stringify({name: req.body.name, script: req.body.script, description: req.body.description}), function (err, reply) {
      if (err) { throw err; }
    });
    res.redirect('/handler')
  });
});

module.exports = router;
