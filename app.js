var express = require('express');
var exphbs  = require('express-handlebars');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var co = require('co-express');
var safeEval = require('safe-eval');
var newman = require('newman');
var date = require('date-and-time');
var log4js = require('log4js');
var intervalIds = require('./intervalIds');

var index = require('./routes/index');
var users = require('./routes/users');
var collection = require('./routes/collection');
var handler = require('./routes/handler');

var app = express();

// view engine setup
var hbs = exphbs.create({
  defaultLayout: 'main',
  // Specify helpers which are only registered on this instance.
  helpers: {
    if_req: function (a, b, opts) {
      if(a === b)
        return opts.fn(this);
      else
        return opts.inverse(this);
    }
  }
});
app.engine('handlebars', hbs.engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator([]));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/collection', collection);
app.use('/handler', handler);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // render the error page
  res.status(err.status || 500);
  res.render('error', {error: err});
});

module.exports = app;

// global helper function
var redis = require("redis");
var redisWrapper = require('co-redis');
var redisLogger = log4js.getLogger('redis');
redisLogger.level = 'debug';
if (process.env.LOG_LEVEL) {
  redisLogger.level = process.env.LOG_LEVEL;
}

getRedis = function () {
  var options = {
    retry_strategy: function (options) {
      return undefined;
    }
  };
  if (process.env.REDIS_AUTH) {
    options['password'] = process.env.REDIS_AUTH;
  }
  if (process.env.REDIS_DB) {
    options['db'] = process.env.REDIS_DB;
  }
  var redisClient = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST, options);
  redisClient.on('error', function (err) {
    redisLogger.error(err);
  });
  return redisClient;
};

getRedisCo = function() {
  return redisWrapper(getRedis());
};

err400 = function (message) {
  var err = new Error(message);
  err.status = 400;
  return err
};

var newmanIntervalLogger = log4js.getLogger('newmanInterval');
newmanIntervalLogger.level = 'debug';
if (process.env.LOG_LEVEL) {
  newmanIntervalLogger.level = process.env.LOG_LEVEL;
}

newmanInterval = function (newmanOption, collectionId) {
  newman.run(newmanOption, function (err, summary) {
    if (err) {
      clearInterval(intervalIds.get(collectionId));
      intervalIds.del(collectionId);
      newmanIntervalLogger.error(err);
      return;
    }
    newmanIntervalLogger.info('collection#' + summary.collection.id + ' run complete!');

    // update run result
    var client = getRedis();
    client.hget('newman-web-collections', summary.collection.id, function (err, reply) {
      if (err) {
        newmanIntervalLogger.error(err);
        return;
      }
      var cObj = JSON.parse(reply);
      if (cObj === null) {
        newmanIntervalLogger.error("cannot get collection info "+summary.collection.id);
        clearInterval(intervalIds.get(summary.collection.id));
        intervalIds.del(summary.collection.id);
        return
      }
      var started = new Date(summary.run.timings.started);
      var completed = new Date(summary.run.timings.completed);
      var assertions = summary.run.stats.assertions;
      var testScripts = summary.run.stats.testScripts;
      cObj['last'] = {
        started: date.format(started, 'YYYY/MM/DD HH:mm:ss'),
        completed: date.format(completed, 'YYYY/MM/DD HH:mm:ss'),
        cost: summary.run.timings.completed - summary.run.timings.started,
        assertions: {
          success: assertions.total - assertions.failed,
          failed: assertions.failed
        },
        testScripts: {
          success: testScripts.total - testScripts.failed,
          failed: testScripts.failed
        }
      };
      client.hset('newman-web-collections', summary.collection.id, JSON.stringify(cObj), function (err, reply) {
        if (err) {
          newmanIntervalLogger.error(err)
        }
      });

      // alert failures
      if (cObj.handler !== '') {
        var failures = summary.run.failures;
        if (failures.length > 0) {
          client.hget('newman-web-handlers', cObj['handler'], function (err, handler) {
            if (err) { throw err; }
            var handlerParams = {};
            if (cObj.handlerParams) {
              handlerParams = JSON.parse(cObj.handlerParams);
            }
            var request = require('postman-request');
            var sprintf = require("sprintf-js").sprintf;
            var vsprintf = require("sprintf-js").vsprintf;
            var client = getRedisCo();
            var co = require('co');
            var context = {
              console: console,
              summary: summary,
              redis: client,
              co: co,
              request: request,
              date: date,
              sprintf: sprintf,
              vsprintf: vsprintf,
              handlerParams: handlerParams
            };
            var obj = JSON.parse(handler);
            try {
              safeEval(obj.script, context);
            } catch (err) {
              newmanIntervalLogger.error(err)
            }
          })
        }
      }
    });
  });
};
