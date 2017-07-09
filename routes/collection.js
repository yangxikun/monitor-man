var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer({ dest: 'upload/' });
var fs = require("fs");
var co = require('co-express');
var Collection = require('postman-collection').Collection;
var intervalIds = require('../intervalIds');

var updateOrCreateCollection = function (req, res, next) {
  var cObj = req.params.cObj;
  var collectionInfo = req.params.collectionInfo;
  var newmanOption = req.params.newmanOption;
  // iterationData and environment
  var iterationDataFile = '';
  var environmentFile = '';
  if (req.files['iterationData']) {
    var file = req.files['iterationData'][0];
    newmanOption.iterationData = file.path;
    collectionInfo.newmanOption.iterationData = newmanOption.iterationData;
    collectionInfo.originIterationDataFileName = file.originalname;
    iterationDataFile = fs.readFileSync(newmanOption.iterationData);
  }

  if (req.files['environment']) {
    var file = req.files['environment'][0];
    newmanOption.environment = file.path;
    collectionInfo.newmanOption.environment = newmanOption.environment;
    collectionInfo.originEnviromentFileName = file.originalname;
    environmentFile = fs.readFileSync(newmanOption.environment);
  }

  if (collectionInfo.status === 'run') {
    // setinterval newman
    clearInterval(intervalIds.get(cObj.id));

    var intervalId = setInterval(function () {
      newmanInterval(newmanOption);
    }, req.body.interval);

    intervalIds.add(cObj.id, intervalId);
  }

  var client = getRedis();
  var _client = client.multi()
    .hset('newman-web-collections', cObj.id, JSON.stringify(collectionInfo));
  if (iterationDataFile !== '') {
    _client = _client.hset('newman-web-iterationData', cObj.id, iterationDataFile)
  }
  if (environmentFile !== '') {
    _client = _client.hset('newman-web-enviroment', cObj.id, environmentFile);
  }
  if (req.params.collectionFile) {
    _client = _client.hset('newman-web-collectionFile', cObj.id, req.params.collectionFile)
  }
  _client.exec(function (err, reply) {
    if (err) {
      clearInterval(intervalId);
      return next(err);
    }
    res.redirect('/');
  });
};

router.get('/create', function (req, res) {
  var client = getRedis();
  client.hgetall('newman-web-handlers', function (err, reply) {
    if (err) { throw err; }
    var handlers = [];
    for (var key in reply) {
      var obj = JSON.parse(reply[key]);
      handlers.push({
        id: key,
        name: obj.name
      });
    }
    res.render('collection/create', {handlers: handlers, page: 'collection'});
  });
});

router.get('/update/:id', co(function* (req, res, next) {
  var redisCo = getRedisCo();
  var reply = yield redisCo.hget('newman-web-collections', req.params.id);
  var cObj = JSON.parse(reply);
  reply = yield redisCo.hgetall('newman-web-handlers');
  var handlers = [];
  for (var key in reply) {
    var obj = JSON.parse(reply[key]);
    var selected = false;
    if (key === cObj.handler) {
      selected = true;
    }
    handlers.push({
      id: key,
      name: obj.name,
      selected: selected
    });
  }
  res.render('collection/update', {collection: cObj, handlers: handlers, page: 'collection'})
}));

router.post('/', upload.fields([{name: 'collection-file', maxCount: 1}, {name: 'iterationData', maxCount: 1}, {name: 'environment', maxCount: 1}]), co(function* (req, res, next) {
  req.checkBody('iterationCount', 'Invalid iterationCount').isInt();
  req.checkBody('interval', 'Invalid interval').isInt();
  req.checkBody('timeoutRequest', 'Invalid timeoutRequest').isInt();
  req.checkBody('delayRequest', 'Invalid delayRequest').isInt();
  var result = yield req.getValidationResult();
  if (!result.isEmpty()) {
    var err = new Error(JSON.stringify(result.array()));
    err.status = 400;
    next(err);
    return
  }
  if (req.files['collection-file'] === undefined) {
    var err = new Error('must upload collection-file');
    err.status = 400;
    next(err);
    return
  }
  // validate collection-file
  var file = req.files['collection-file'][0];
  var collectionFile = fs.readFileSync(file.path);
  var data = JSON.parse(collectionFile);
  var cObj = new Collection(data);
  if (cObj.name === undefined) {
    var err = new Error('Invalid collection-file');
    err.status = 400;
    next(err);
    return
  }
  var client = getRedisCo();
  var exists = yield client.hexists('newman-web-collections', cObj.id);
  if (exists === 1) {
    next(err400('collection ' + cObj.id + ' exists!'));
    return
  }

  var ignoreRedirects = false, insecure = false, bail = false, handlerParams = '{}';
  if (req.body.ignoreRedirects) {
    ignoreRedirects = true;
  }
  if (req.body.insecure) {
    insecure = true;
  }
  if (req.body.bail) {
    bail = true;
  }
  if (req.body.handlerParams) {
    try {
      JSON.parse(req.body.handlerParams)
    } catch (err) {
      return next(err400('Invalid handler params'))
    }
  }
  req.params.collectionFile = collectionFile;
  req.params.cObj = cObj;
  req.params.collectionInfo = {
    id: cObj.id,
    name: cObj.name,
    description: cObj.description.content,
    status: 'run',
    handler: req.body.handler,
    handlerParams: req.body.handlerParams,
    interval: Number(req.body.interval),
    collectionFile: file.path,
    originalCollectionFileName: file.originalname,
    newmanOption: {
      iterationData: '',
      environment: '',
      iterationCount: Number(req.body.iterationCount),
      timeoutRequest: Number(req.body.timeoutRequest),
      delayRequest: Number(req.body.delayRequest),
      ignoreRedirects: ignoreRedirects,
      insecure: insecure,
      bail: bail
    }
  };
  req.params.newmanOption = Object.assign({
    collection: cObj,
    abortOnError: true
  }, req.params.collectionInfo.newmanOption);
  if (req.params.newmanOption.timeoutRequest === 0) {
    delete req.params.newmanOption.timeoutRequest;
  }
  next();
}), updateOrCreateCollection);

router.post('/stop/:id', co(function* (req, res) {
  clearInterval(intervalIds.get(req.params.id));
  intervalIds.del(req.params.id);
  var client = getRedisCo();
  var collectionInfo = yield client.hget('newman-web-collections', req.params.id);
  collectionInfo = JSON.parse(collectionInfo);
  collectionInfo.status = 'stop';
  collectionInfo = JSON.stringify(collectionInfo);
  yield client.hset('newman-web-collections', req.params.id, collectionInfo);
  res.send()
}));

router.post('/run/:id', co(function* (req, res) {
  clearInterval(intervalIds.get(req.params.id));
  var client = getRedisCo();
  var collectionInfo = yield client.hget('newman-web-collections', req.params.id);
  collectionInfo = JSON.parse(collectionInfo);
  var collectionFile = yield client.hget('newman-web-collectionFile', req.params.id);
  var collection = new Collection(JSON.parse(collectionFile));
  var newmanOption = Object.assign({
    collection: collection,
    abortOnError: true
  }, collectionInfo.newmanOption);
  if (newmanOption.timeoutRequest === 0) {
    delete newmanOption.timeoutRequest;
  }
  var intervalId = setInterval(function () {
    newmanInterval(newmanOption);
  }, collectionInfo.interval);
  intervalIds.add(req.params.id, intervalId);
  collectionInfo.status = 'run';
  collectionInfo = JSON.stringify(collectionInfo);
  yield client.hset('newman-web-collections', req.params.id, collectionInfo);
  res.send()
}));

router.post('/update/:id', upload.fields([
  {name: 'collection-file', maxCount: 1},
  {name: 'iterationData', maxCount: 1},
  {name: 'environment', maxCount: 1}
  ]), co(function* (req, res, next) {

  req.checkBody('iterationCount', 'Invalid iterationCount').isInt();
  req.checkBody('interval', 'Invalid interval').isInt();
  req.checkBody('timeoutRequest', 'Invalid timeoutRequest').isInt();
  req.checkBody('delayRequest', 'Invalid delayRequest').isInt();
  var result = yield req.getValidationResult();
  if (!result.isEmpty()) {
    var err = new Error(JSON.stringify(result.array()));
    err.status = 400;
    next(err);
    return
  }
  if (req.body.handlerParams) {
    try {
      JSON.parse(req.body.handlerParams)
    } catch (err) {
      return next(err400('Invalid handler params'))
    }
  }

  var client = getRedisCo();
  // update collection
  var cObj;
  if (req.files['collection-file'] !== undefined) {
    // validate collection-file
    var file = req.files['collection-file'][0];
    var collectionFile = fs.readFileSync(file.path);
    var data = JSON.parse(collectionFile);
    cObj = new Collection(data);
    if (cObj.name === undefined) {
      next(err400('Invalid collection-file!'));
      return
    }
    if (cObj.id !== req.params.id) {
      next(err400('collection-file id not match!'));
      return
    }
    req.params.collectionFile = collectionFile;
  } else {
    // load origin collection-file
    var collectionFile = yield client.hget('newman-web-collectionFile', req.params.id);
    var data = JSON.parse(collectionFile);
    cObj = new Collection(data);
  }
  req.params.cObj = cObj;
  var collectionInfo = yield client.hget('newman-web-collections', req.params.id);
  collectionInfo = JSON.parse(collectionInfo);
  collectionInfo.interval = Number(req.body.interval);
  collectionInfo.handler = req.body.handler;
  collectionInfo.handlerParams = req.body.handlerParams;
  collectionInfo.newmanOption.iterationCount = Number(req.body.iterationCount);
  collectionInfo.newmanOption.delayRequest = Number(req.body.delayRequest);
  collectionInfo.newmanOption.timeoutRequest = Number(req.body.timeoutRequest);
  collectionInfo.newmanOption.ignoreRedirects = !!req.body.ignoreRedirects;
  collectionInfo.newmanOption.insecure = !!req.body.insecure;
  collectionInfo.newmanOption.bail = !!req.body.bail;

  req.params.collectionInfo = collectionInfo;
  req.params.newmanOption = Object.assign({
    collection: cObj,
    abortOnError: true
  }, collectionInfo.newmanOption);
  if (req.params.newmanOption.timeoutRequest === 0) {
    delete req.params.newmanOption.timeoutRequest;
  }
  next();
}), updateOrCreateCollection);

router.get('/:id', function (req, res, next) {
  var client = getRedis();
  var collection;
  client.hget('newman-web-collections', req.params.id, function (err, reply) {
    if (err) {
      next(err);
      return
    }
    var collectionInfo = JSON.parse(reply);
    client.hget('newman-web-handlers', collectionInfo.handler, function (err, reply) {
      if (err) {
        next(err);
        return
      }
      var handler = JSON.parse(reply);
      res.render('collection/show', {collection: collectionInfo, handler: handler, page: 'collection'});
    });
  });
});

router.delete('/:id', function (req, res, next) {
  clearInterval(intervalIds.get(req.params.id));
  intervalIds.del(req.params.id);
  var client = getRedis();
  client.multi()
    .hdel('newman-web-collections', req.params.id)
    .hdel('newman-web-collectionFile', req.params.id)
    .hdel('newman-web-enviroment', req.params.id)
    .hdel('newman-web-iterationData', req.params.id)
    .exec(function (err, reply) {
      if (err) {
        next(err);
        return
      }
      res.send('')
    });
});

router.get('/download/:id/:type', function (req, res, next) {
  var client = getRedis();
  client.hget('newman-web-collections', req.params.id, function (err, reply) {
    if (err) {
      next(err);
      return
    }
    var collectionInfo = JSON.parse(reply);
    if (req.params.type === 'iterationData') {
      res.download(collectionInfo.newmanOption.iterationData, collectionInfo.originIterationDataFileName);
      return
    }
    if (req.params.type === 'environment') {
      res.download(collectionInfo.newmanOption.environment, collectionInfo.originEnviromentFileName);
      return
    }
    if (req.params.type === 'collection') {
      res.download(collectionInfo.collectionFile, collectionInfo.originalCollectionFileName);
      return
    }
  });
});

module.exports = router;
