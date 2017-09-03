const router = new (require('koa-router'))({prefix: '/tag'})
  , redis = require('./util/redis');

router.get('/', async function (ctx) {
  const redisClient = redis.getConn();
  const tags = await redisClient.smembersAsync('monitor-man-tag');
  tags.sort(function (item1, item2) {
    return item1.localeCompare(item2)
  });
  ctx.response.body = tags;
});

module.exports = router;
