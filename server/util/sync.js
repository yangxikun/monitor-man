const redis = require('./redis')
  , logger = require('./log').get('sync')
  , intervalIds = require('./intervalIds')
  , fs = require('fs')
  , Collection = require('postman-collection').Collection
  , newman = require('./newman');

const _sync = {
  run: async function() {
    try {
      let redisClient = redis.getConn();
      const collectionInfos = await redisClient.hgetallAsync('monitor-man-collection');
      for (let id in collectionInfos) {
        let collectionInfo = JSON.parse(collectionInfos[id]);

        // clean failures
        this.rotateSummaries(id, collectionInfo.reserved);

        const i = intervalIds.get(id);

        // if the collection has been stop
        if (collectionInfo.status === 'stop') {
          if (i) {
            clearInterval(i.intervalId);
            intervalIds.del(id);
          }
          continue;
        }

        // if the collection hasn't been run or collection has been update
        if (i === undefined || i.ts < collectionInfo.timestamp) {
          if (i) {
            clearInterval(i.intervalId);
            intervalIds.del(id);
          }
          const collectionFileData = await redisClient.hgetAsync('monitor-man-collectionFile', id);
          if (!collectionFileData) {
            logger.error(collectionInfo.name + ' ' + id + 'collection file not found!');
            continue;
          }
          if (!fs.existsSync(collectionInfo.collectionFile)) {
            fs.writeFileSync(collectionInfo.collectionFile, collectionFileData)
          }
          const cObj = new Collection(JSON.parse(collectionFileData));
          let newmanOption = Object.assign({
            collection: cObj,
            abortOnError: true
          }, collectionInfo.newmanOption);
          if (newmanOption.timeoutRequest === 0) {
            delete newmanOption.timeoutRequest;
          }

          let path;
          if (collectionInfo.iterationData) {
            const iterationData = await redisClient.hgetAsync('monitor-man-iterationData', id);
            if (iterationData) {
              path = collectionInfo.iterationData.path;
              if (!fs.existsSync(path)) {
                fs.writeFileSync(path, iterationData);
              }
              newmanOption.iterationData = path;
            }
          }
          if (collectionInfo.environment) {
            const environment = await redisClient.hgetAsync('monitor-man-environment', id);
            if (environment) {
              path = collectionInfo.environment.path;
              if (!fs.existsSync(path)) {
                fs.writeFileSync(path, environment);
              }
              newmanOption.environment = path;
            }
          }
          const intervalId = this.setInterval(newmanOption, id, collectionInfo.interval);
          intervalIds.add(id, intervalId, collectionInfo.timestamp);
          logger.info("restore " + id);
        }
      }
    } catch (e) {
      logger.error(e);
    }
  },
  setInterval: function(newmanOption, id, interval) {
    return setInterval(function () {
      newman.run(newmanOption, id);
    }, interval);
  },
  rotateSummaries: async function(collectionId, reserved) {
    let redisClient = redis.getConn();
    const now = Date.now();
    const summaries = await redisClient.zrangebyscoreAsync('monitor-man-summary-' + collectionId, 0, now-reserved*24*3600*1000);
    const failuresKey = 'monitor-man-summary-failures-' + collectionId;
    for (let index in summaries) {
      const _summaries = JSON.parse(summaries[index]);
      for (let failureId in _summaries.assertions.failures) {
        await redisClient.hdelAsync(failuresKey, failureId);
      }
      for (let failureId in _summaries.assertions.failures) {
        await redisClient.hdelAsync(failuresKey, failureId);
      }
    }
    await redisClient.zremrangebyscoreAsync('monitor-man-summary-' + collectionId, 0, now-reserved*24*3600*1000);
  }
};

module.exports = _sync;
