# monitor-man
HTTP API monitor based on postman and newman. It provides webui for newman, and some other useful things.

![Home Page](https://github.com/yangxikun/monitor-man/raw/master/public/images/home.png)

## How it work
1. setup monitor-man
1. export your collection, data file, enviroment from postman, then upload to monitor-man
1. monitor-man will setup a newman for monitor your test

## Setup

#### By Node

1. git clone this project
1. run `npm install`
1. change listening port `export PORT=9200`(default 3000)
1. set redis info `export REDIS_HOST=127.0.0.1;export REDIS_PORT=6379;export REDIS_AUTH=123456` (monitor-man rely on redis to store all information)
1. set log level `export LOG_LEVEL=debug`
1. run `node bin/www`

#### BY Docker

1. `docker pull yangxikun/monitor-man`
1. `docker run --env REDIS_HOST=10.17.48.200 --env REDIS_PORT=6379 --env TIMEZONE=Asia/Shanghai -p 3000:3000 yangxikun/monitor-man:1.0.0`
1. now, visit http://127.0.0.1:3000

build docker image:

1. git clone this project
1. npm install
1. wget https://nodejs.org/dist/v6.11.1/node-v6.11.1-linux-x64.tar.xz
1. docker build -t yangxikun/monitor-man:1.0.0 .

#### Available config environment variable

* REDIS_HOST
* REDIS_PORT
* REDIS_AUTH
* REDIS_DB
* TIMEZONE: see `/usr/share/zoneinfo/`(docker only)
* LOG_LEVEL: default debug, see [log4js](https://www.npmjs.com/package/log4js)

## Doc
see [Wiki](https://github.com/yangxikun/monitor-man/wiki)

## License
This software is licensed under MIT. See the [LICENSE](LICENSE) file for more information.