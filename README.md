# monitor-man

HTTP API monitor based on postman and newman. It provides webui for newman, and some other useful things.

> For multi IDC deploy support, see [monitor-man-distribute](https://github.com/yangxikun/monitor-man-distribute)

![Home Page](https://github.com/yangxikun/monitor-man/raw/master/static/images/home.png)

## How it work

1. setup monitor-man
1. export your collection, data file, enviroment from postman, then upload to monitor-man
1. monitor-man will setup a newman for monitor your test

## Setup

#### By Node

1. git clone this project
1. run `npm install` or `yarn install`
1. change listening port `export PORT=9200`(default 8889)
1. set redis info `export REDIS_HOST=127.0.0.1;export REDIS_PORT=6379;export REDIS_AUTH=foobar123;export REDIS_DB=0` (monitor-man rely on redis to store all information)
1. set log level `export LOG_LEVEL=debug`, default to debug
1. run `node app.js`

#### BY Docker

1. `docker pull yangxikun/monitor-man`(https://hub.docker.com/r/yangxikun/monitor-man/)
1. `docker run --name monitor-man --env REDIS_HOST=10.17.16.5 --env REDIS_PORT=6379 --env REDIS_DB=1 --env REDIS_AUTH=foobar123 --env TIMEZONE=Asia/Shanghai -p 8889:8889 yangxikun/monitor-man:2.0.1`
1. now, visit http://127.0.0.1:8889

build docker image:

1. git clone this project
1. npm install
1. wget https://nodejs.org/dist/v8.4.0/node-v8.4.0-linux-x64.tar.xz
1. docker build -t yangxikun/monitor-man:2.0.1 .

#### Available config environment variable

* PORT: listen port
* REDIS_HOST
* REDIS_PORT
* REDIS_AUTH
* REDIS_DB
* TIMEZONE: see `/usr/share/zoneinfo/`(docker only)
* LOG_LEVEL: default debug, see [log4js](https://www.npmjs.com/package/log4js)

## Doc
see [Wiki](https://github.com/yangxikun/monitor-man/wiki)

## Write tests for APIs using Postman
* [How to write automated tests for APIs using Postman – Part 1](http://blog.getpostman.com/2014/03/07/writing-automated-tests-for-apis-using-postman/)
* [How to write automated tests for APIs with Postman – Part 2](http://blog.getpostman.com/2014/04/17/how-to-write-automated-tests-for-apis-with-postman-part-2/)
* [Writing automated tests with Postman – Part 3](http://blog.getpostman.com/2014/05/09/writing-automated-tests-with-postman-part-3/)
* [API testing tips from a Postman professional](http://blog.getpostman.com/2017/07/28/api-testing-tips-from-a-postman-professional/)

## License
This software is licensed under MIT. See the [LICENSE](LICENSE) file for more information.
