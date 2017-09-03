#!/bin/bash

if [ ! -z $TIMEZONE  ]; then
    cp /usr/share/zoneinfo/$TIMEZONE /etc/localtime
fi

cd /opt/monitor-man;node app.js
