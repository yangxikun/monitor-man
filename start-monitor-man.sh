#!/bin/bash

if [ ! -z $TIMEZONE ]; then
        cp /usr/share/zoneinfo/$TIMEZONE /etc/localtime
fi

cd /root/monitor-man;node bin/www