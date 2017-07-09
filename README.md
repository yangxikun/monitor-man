# monitor-man
HTTP API monitor based on postman and newman. It provides webui for newman, and some other useful things.

## How it work
1. setup monitor-man
1. export your collection, data file, enviroment from postman, then upload to monitor-man
1. monitor-man will setup a newman for monitor your test

## Setup
1. git clone this project
1. run `npm install`
1. change listening port `export PORT=9200`
1. set redis info `export REDIS_HOST=127.0.0.1;export REDIS_PORT=6379` (monitor-man reply on redis to store all information)
1. run `node bin/www`

## License
This software is licensed under MIT. See the [LICENSE.md](LICENSE.md) file for more information.