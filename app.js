const app = new (require('koa'))()
  , json = require('koa-json')
  , appLogger = require('./server/util/log').get('app')
  , onerror = require('koa-onerror')
  , collectionSync = require('./server/util/sync')
  , path =require('path')
  , staticServe = require('koa-static');

app.use(staticServe(path.resolve('dist')));

onerror(app);
require('koa-validate')(app);

app.use(require('koa-body')({ multipart: true }));
app.use(json());

app.use(async (ctx, next) => {
  let start = new Date;
  await next();
  let ms = new Date - start;
  appLogger.info('%s %s - %s', ctx.request.method, ctx.request.url, ms); // 显示执行的时间
});

const collection = require('./server/collection');
app.use(collection.routes());
app.use(collection.allowedMethods());

const tag = require('./server/tag');
app.use(tag.routes());
app.use(tag.allowedMethods());

const handler = require('./server/handler');
app.use(handler.routes());
app.use(handler.allowedMethods());

app.on('error', function(err, ctx){
  appLogger.error('server error', err);
});

const port = process.env.PORT || 8889;
app.listen(port,() => {
  appLogger.info('monitor-man is listening in ' + port);

  // sync collection
  collectionSync.run();
  setInterval(function(){collectionSync.run()}, 10000);
});

module.exports = app;
