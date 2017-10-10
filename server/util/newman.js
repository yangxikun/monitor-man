const newman = require('newman')
  , newmanIntervalLogger = require('./log').get('newman')
  , intervalIds = require('./intervalIds')
  , redis = require('./redis')
  , date = require('date-and-time')
  , uuidv1 = require('uuid/v1')
  , safeEval = require('safe-eval');

const _newman = {
  run: function (newmanOption, collectionId) {

    newman.run(newmanOption, async (err, summary) => {
      try {
        if (err) {
          this.stop(collectionId);
          newmanIntervalLogger.error(err);
          return;
        }

        newmanIntervalLogger.debug('run newman with options:\n', newmanOption);

        // update run result
        let redisClient = redis.getConn();
        const _collectionInfo = await redisClient.hgetAsync('monitor-man-collection', collectionId);
        const collectionInfo = JSON.parse(_collectionInfo);
        if (collectionInfo === null) {
          newmanIntervalLogger.error("cannot get collection info "+ collectionId);
          this.stop(collectionId);
          return
        }

        newmanIntervalLogger.info('collection#' + collectionInfo.name + ' run complete!');

        // save result summary
        let _summary = {};
        const started = new Date(summary.run.timings.started);
        _summary['started'] = date.format(started, 'YYYY/MM/DD HH:mm:ss');
        const completed = new Date(summary.run.timings.completed);
        _summary['completed'] = date.format(completed, 'YYYY/MM/DD HH:mm:ss');
        _summary['cost'] = summary.run.timings.completed - summary.run.timings.started;
        const assertions = summary.run.stats.assertions;
        const testScripts = summary.run.stats.testScripts;
        _summary['assertions'] = {
          success: assertions.total - assertions.failed,
          failed: assertions.failed,
          failures: {},
        };
        _summary['testScripts'] = {
          success: testScripts.total - testScripts.failed,
          failed: testScripts.failed,
          failures: {},
        };
        let redisClientMulti = redisClient.multi();
        const failures = summary.run.failures;
        let _failures = {};
        if (failures.length > 0) {
          for (let i in failures) {
            if (_failures[failures[i].cursor.ref]) {
              _failures[failures[i].cursor.ref].failures.push(failures[i]);
            } else {
              _failures[failures[i].cursor.ref] = {failures: [failures[i]], execution: null};
            }
          }
          for (let i in summary.run.executions) {
            const execution = summary.run.executions[i];
            const failureExecutions = _failures[execution.cursor.ref];
            if (!failureExecutions) continue;

            if (execution.response) {
              execution.response.stream = execution.response.stream.toString();
            }
            delete execution.cursor;
            failureExecutions.execution = execution;
            const jsonExecution = JSON.stringify(execution);

            for (let index in failureExecutions.failures) {
              const failureExecution = failureExecutions.failures[index];
              const name = failureExecution.source.name;
              const failureId = uuidv1();
              if (failureExecution.at.indexOf('assertion') === 0) {
                const _failureId = failureId+'a'+i+index;
                _summary['assertions'].failures[_failureId] = name;
                redisClientMulti = redisClientMulti
                  .hset('monitor-man-summary-failures-' + collectionId, _failureId, jsonExecution);
              } else if (failureExecution.at.indexOf('test-script') === 0) {
                const _failureId = failureId+'t'+i+index;
                _summary['testScripts'].failures[_failureId] = name;
                redisClientMulti = redisClientMulti
                  .hset('monitor-man-summary-failures-' + collectionId, _failureId, jsonExecution);
              }
            }
          }
        }
        collectionInfo['summary'] = _summary;
        redisClientMulti
          .zadd('monitor-man-summary-' + collectionId, summary.run.timings.completed, JSON.stringify(_summary))
          .hset('monitor-man-collection', collectionId, JSON.stringify(collectionInfo))
          .exec(function (err, reply) {
            if (err) {
              newmanIntervalLogger.error(err);
            }
          });

        // alert failures
        if (collectionInfo.handler !== '' && failures.length > 0) {
          const handler = await redisClient.hgetAsync('monitor-man-handler', collectionInfo.handler);
          _failures = JSON.parse(JSON.stringify(_failures));
          if (handler) {
            const handlerParams = JSON.parse(collectionInfo.handlerParams);
            const request = require('postman-request');
            const sprintf = require("sprintf-js").sprintf;
            const vsprintf = require("sprintf-js").vsprintf;
            const redisClient = redis.getConn();
            const context = {
              console: console,
              failures: _failures,
              redis: redisClient,
              request: request,
              date: date,
              sprintf: sprintf,
              vsprintf: vsprintf,
              handlerParams: handlerParams,
            };
            const obj = JSON.parse(handler);
            if (obj) {
              safeEval(obj.code, context);
            }
          }
        }
      } catch (e) {
        newmanIntervalLogger.error(e);
      }
    }); // run
  },
  stop: function (collectionId) {
    const i = intervalIds.get(collectionId);
    if (i) {
      clearInterval(i.intervalId);
      intervalIds.del(collectionId);
    }
  }
};

module.exports = _newman;
