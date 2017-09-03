const router = new (require('koa-router'))({prefix: '/collection'})
  , fs = require('fs')
  , redis = require('./util/redis')
  , uuidv1 = require('uuid/v1');

// get all collections
router.get('/', async function (ctx) {
  const redisClient = redis.getConn();
  const collections = await redisClient.hgetallAsync('monitor-man-collection');
  ctx.response.body = [];
  for (let id in collections) {
    const collection = JSON.parse(collections[id]);
    ctx.response.body.push(Object.assign({
      id: id
    }, collection));
  }
});

// get collection execution failure
router.get('/:collectionId/failure/:id', async function (ctx) {
  const redisClient = redis.getConn();
  ctx.response.body = await redisClient.hgetAsync(
    'monitor-man-summary-failures-' + ctx.params.collectionId, ctx.params.id);
});

// download collectionFile, iterationData, environment
router.get('/:collectionId/download/:type', async function (ctx) {
  const collectionId = ctx.params.collectionId;
  const redisClient = redis.getConn();
  let collectionInfo = await redisClient.hgetAsync('monitor-man-collection',collectionId);
  if (!collectionInfo) {
    ctx.throw(400, 'Collection not found.');
  }
  collectionInfo = JSON.parse(collectionInfo);
  const type = ctx.params.type;
  if (type === "collectionFile") {
    ctx.response.body = await redisClient.hgetAsync('monitor-man-' + type, collectionId);
    ctx.response.set('Content-disposition', 'attachment; filename=' + collectionInfo.originalCollectionFileName);
    ctx.response.set('Content-type', 'application/octet-stream');
    return;
  }

  if (!collectionInfo[type]) {
    ctx.throw(400, 'Invalid type.');
    return;
  }

  const file = collectionInfo[type];
  ctx.response.body = await redisClient.hgetAsync('monitor-man-' + type, collectionId);
  ctx.response.set('Content-disposition', 'attachment; filename=' + file.originalName);
  ctx.response.set('Content-type', 'application/octet-stream');
});

// get collections by tag
router.get('/tag/:tag', async function (ctx) {
  const redisClient = redis.getConn();
  let collectionIds = await redisClient.smembersAsync('monitor-man-tag-'+ctx.params.tag);
  if (!collectionIds || collectionIds.length === 0) {
    ctx.response.body = [];
    return;
  }
  let collections = await redisClient.hmgetAsync('monitor-man-collection', collectionIds);
  if (!collections) {
    ctx.response.body = [];
    return;
  }
  ctx.response.body = [];
  for (let id in collections) {
    const collection = JSON.parse(collections[id]);
    ctx.response.body.push(Object.assign({
      id: collectionIds[id]
    }, collection));
  }
});

// delete collection
router.delete('/:id', async function (ctx) {
  const collectionId =  ctx.params.id;
  let redisClient = redis.getConn();
  let collectionInfo = await redisClient.hgetAsync('monitor-man-collection',collectionId);
  if (!collectionInfo) {
    ctx.throw(400, 'Collection not found.');
  }
  collectionInfo = JSON.parse(collectionInfo);
  redisClient = redisClient.multi();
  // delete collection file
  redisClient = redisClient.hdel('monitor-man-collectionFile', collectionId);
  // delete summaries
  redisClient = redisClient.del('monitor-man-summary-failures-'+collectionId);
  redisClient = redisClient.del('monitor-man-summary-'+collectionId);
  // delete iterationdata and environment
  redisClient = redisClient.hdel('monitor-man-iterationData', collectionId);
  redisClient = redisClient.hdel('monitor-man-environment', collectionId);
  // delete from tag
  for (let index in collectionInfo.tag) {
    redisClient = redisClient.srem('monitor-man-tag-'+collectionInfo.tag[index], collectionId);
  }
  redisClient = redisClient.hdel('monitor-man-collection', collectionId);
  await redisClient.execAsync();
  // remove tag, if tag does not relate to any collection
  redisClient = redis.getConn();
  for (let index in collectionInfo.tag) {
    const count = await redisClient.scardAsync('monitor-man-tag-' + collectionInfo.tag[index]);
    if (count === 0) {
      await redisClient.sremAsync('monitor-man-tag', collectionInfo.tag[index]);
    }
  }
  ctx.response.body = '';
});

// get collection by id
router.get('/:id', async function (ctx) {
  const redisClient = redis.getConn();
  const collectionInfo = await redisClient.hgetAsync('monitor-man-collection', ctx.params.id);
  if (!collectionInfo) {
    ctx.throw(400, 'Collection not found.');
  }
  ctx.response.body = JSON.parse(collectionInfo)
});

// get collection summaries
router.get('/:id/summaries', async function (ctx) {
  let startTime = Date.now() - 2*3600*1000;
  let endTime = '+inf';
  if (ctx.request.query['s'] && ctx.request.query['e']) {
    startTime = ctx.request.query['s'];
    endTime = ctx.request.query['e'];
  }
  const redisClient = redis.getConn();
  ctx.response.body = await redisClient.zrangebyscoreAsync('monitor-man-summary-'+ctx.params.id, startTime, endTime);
});

// post collection for update
router.post('/:id/update', async function (ctx) {
  const collectionId = ctx.params.id;
  let redisClient = redis.getConn();
  let collectionInfo = await redisClient.hgetAsync('monitor-man-collection', collectionId);
  if (!collectionInfo) {
    ctx.throw(400, 'Collection not found.');
  }
  collectionInfo = JSON.parse(collectionInfo);
  const oldTag = collectionInfo['tag'];
  collectionInfo['tag'] = ctx.checkBody('tag').optional().default('').value.split(',');
  collectionInfo['tag'] = collectionInfo['tag'].filter(function(n){ return n !== "" });
  collectionInfo['reserved'] = ctx.checkBody('reserved').isInt().toInt().value;
  collectionInfo['interval'] = ctx.checkBody('interval').isInt().gt(1000).toInt().value;
  collectionInfo['handler'] = ctx.checkBody('handler').optional().default('').value;
  collectionInfo['handlerParams'] = ctx.checkBody('handlerParams').optional().isJSON().default('{}').value;
  collectionInfo.newmanOption['timeoutRequest'] = ctx.checkBody('timeoutRequest').isInt().toInt().value;
  collectionInfo.newmanOption['delayRequest'] = ctx.checkBody('delayRequest').isInt().toInt().value;
  collectionInfo.newmanOption['iterationCount'] = ctx.checkBody('iterationCount').isInt().toInt().value;
  collectionInfo.newmanOption['ignoreRedirects'] = ctx.checkBody('ignoreRedirects').isIn(['true', 'false']).toBoolean().value;
  collectionInfo.newmanOption['insecure'] = ctx.checkBody('insecure').isIn(['true', 'false']).toBoolean().value;
  collectionInfo.newmanOption['bail'] = ctx.checkBody('bail').isIn(['true', 'false']).toBoolean().value;
  if (ctx.errors) {
    ctx.response.status = 400;
    ctx.response.body = ctx.errors;
    return;
  }
  redisClient = redisClient.multi();
  // update collection file
  const collectionFile = ctx.request.body.files.collection;
  if (collectionFile) {
    delete ctx.request.body.files.collection;
    // update collection file
    collectionInfo['collectionFile'] = collectionFile.path;
    collectionInfo['originalCollectionFileName'] = collectionFile.name;
    let collectionFileData = fs.readFileSync(collectionFile.path);
    const cObj = JSON.parse(collectionFileData);
    if (!cObj.info || !cObj.info.name) {
      ctx.throw(400, 'Invalid collection file.');
      return;
    }
    collectionInfo['name'] = cObj.info.name;
    collectionInfo['description'] = cObj.info.description;
    redisClient.hset('monitor-man-collectionFile', collectionId, collectionFileData);
  }
  const ts = Date.now();
  collectionInfo.timestamp = ts;

  // update iterationData, environment
  let iterationData = null;
  let environment = null;
  for (let key in ctx.request.body.files) {
    let file = ctx.request.body.files[key];
    if (key === 'iterationData') {
      iterationData = {
        type: 'file',
        path: file.path,
        originalName: file.name
      };
    } else if (key === 'environment') {
      environment = {
        type: 'file',
        path: file.path,
        originalName: file.name
      }
    }
  }

  if (iterationData) {
    const fileData = fs.readFileSync(iterationData.path);
    redisClient = redisClient.hset('monitor-man-iterationData', collectionId, fileData);
    collectionInfo.iterationData = iterationData;
  }
  if (environment) {
    const fileData = fs.readFileSync(environment.path);
    redisClient = redisClient.hset('monitor-man-environment', collectionId, fileData);
    collectionInfo.environment = environment;
  }

  redisClient = redisClient.hset('monitor-man-collection', collectionId, JSON.stringify(collectionInfo));

  let remTagKeys = [];
  for (let index in oldTag) {
    if (collectionInfo['tag'].indexOf(oldTag[index]) === -1) {
      remTagKeys.push(oldTag[index]);
      const key = 'monitor-man-tag-' + oldTag[index];
      redisClient = redisClient.srem(key, collectionId);
    }
  }
  for (let index in collectionInfo['tag']) {
    if (oldTag.indexOf(collectionInfo['tag'][index]) === -1) {
      const key = 'monitor-man-tag-' + collectionInfo['tag'][index];
      redisClient = redisClient.sadd(key, collectionId);
      redisClient = redisClient.sadd('monitor-man-tag', collectionInfo['tag'][index]);
    }
  }

  await redisClient.execAsync();

  // remove tag, if tag does not relate to any collection
  redisClient = redis.getConn();
  for (let index in remTagKeys) {
    const count = await redisClient.scardAsync('monitor-man-tag-' + remTagKeys[index]);
    if (count === 0) {
      await redisClient.sremAsync('monitor-man-tag', remTagKeys[index]);
    }
  }
  ctx.response.body = '';
});

// stop/start collection
router.post('/:id/:status', async function (ctx) {
  const redisClient = redis.getConn();
  let collectionInfo = await redisClient.hgetAsync('monitor-man-collection', ctx.params.id);
  if (!collectionInfo) {
    ctx.throw(400, 'Collection not found.');
  }
  collectionInfo = JSON.parse(collectionInfo);
  collectionInfo.status = ctx.params.status;
  collectionInfo.timestamp = Date.now();
  await redisClient.hsetAsync('monitor-man-collection', ctx.params.id, JSON.stringify(collectionInfo));
  ctx.response.body = '';
});

// create collection
router.post('/', async function (ctx) {
  let collectionInfo = {newmanOption: {}};
  collectionInfo['tag'] = ctx.checkBody('tag').optional().default('').value.split(',');
  collectionInfo['tag'] = collectionInfo['tag'].filter(function(n){ return n !== "" });
  collectionInfo['reserved'] = ctx.checkBody('reserved').isInt().toInt().value;
  collectionInfo['interval'] = ctx.checkBody('interval').isInt().gt(1000).toInt().value;
  collectionInfo['handler'] = ctx.checkBody('handler').optional().default('').value;
  collectionInfo['handlerParams'] = ctx.checkBody('handlerParams').optional().isJSON().default('{}').value;
  collectionInfo.newmanOption['timeoutRequest'] = ctx.checkBody('timeoutRequest').isInt().toInt().value;
  collectionInfo.newmanOption['delayRequest'] = ctx.checkBody('delayRequest').isInt().toInt().value;
  collectionInfo.newmanOption['iterationCount'] = ctx.checkBody('iterationCount').isInt().toInt().value;
  collectionInfo.newmanOption['ignoreRedirects'] = ctx.checkBody('ignoreRedirects').isIn(['true', 'false']).toBoolean().value;
  collectionInfo.newmanOption['insecure'] = ctx.checkBody('insecure').isIn(['true', 'false']).toBoolean().value;
  collectionInfo.newmanOption['bail'] = ctx.checkBody('bail').isIn(['true', 'false']).toBoolean().value;
  ctx.checkFile('collection').notEmpty();
  if (ctx.errors) {
    ctx.response.status = 400;
    ctx.response.body = ctx.errors;
    return;
  }

  const collectionFile = ctx.request.body.files.collection;
  delete ctx.request.body.files.collection;
  collectionInfo['collectionFile'] = collectionFile.path;
  collectionInfo['originalCollectionFileName'] = collectionFile.name;
  let collectionFileData = fs.readFileSync(collectionFile.path);
  const cObj = JSON.parse(collectionFileData);
  if (!cObj.info || !cObj.info.name) {
    ctx.throw(400, 'Invalid collection file.');
    return;
  }
  collectionInfo['name'] = cObj.info.name;
  collectionInfo['description'] = cObj.info.description;
  const ts = Date.now();
  collectionInfo.status = 'running';
  collectionInfo.timestamp = ts;
  let iterationData = null;
  let environment = null;
  for (let key in ctx.request.body.files) {
    let file = ctx.request.body.files[key];
    if (key === 'iterationData') {
      iterationData = {
        type: 'file',
        path: file.path,
        originalName: file.name
      };
    } else if (key === 'environment') {
      environment = {
        type: 'file',
        path: file.path,
        originalName: file.name
      }
    }
  }
  collectionInfo['iterationData'] = iterationData;
  collectionInfo['environment'] = environment;

  const collectionId = uuidv1();
  let redisClient = redis.getConn();

  redisClient = redisClient.multi()
    .hset('monitor-man-collection', collectionId, JSON.stringify(collectionInfo))
    .hset('monitor-man-collectionFile', collectionId, collectionFileData);

  if (iterationData) {
    const fileData = fs.readFileSync(iterationData.path);
    redisClient = redisClient.hset('monitor-man-iterationData', collectionId, fileData);
  }
  if (environment) {
    const fileData = fs.readFileSync(environment.path);
    redisClient = redisClient.hset('monitor-man-environment', collectionId, fileData);
  }

  if (collectionInfo['tag']) {
    for (let index in collectionInfo['tag']) {
      redisClient = redisClient.sadd('monitor-man-tag-'+collectionInfo['tag'][index], collectionId);
      redisClient = redisClient.sadd('monitor-man-tag', collectionInfo['tag'][index]);
    }
  }

  await redisClient.execAsync();
  ctx.response.body = '';
});

module.exports = router;
