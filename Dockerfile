FROM centos:latest
LABEL maintainer="yangrokety@gmail.com"
LABEL description="Http api monitor based on newman and postman."

COPY . /opt/monitor-man
RUN mv /opt/monitor-man/node-v8.4.0-linux-x64.tar.xz /opt/
RUN cd /opt;tar -xvf node-v8.4.0-linux-x64.tar.xz;rm node-v8.4.0-linux-x64.tar.xz
RUN cd /usr/bin;ln -s /opt/node-v8.4.0-linux-x64/bin/* ./
COPY start-monitor-man.sh /opt/start-monitor-man.sh

ENTRYPOINT /opt/start-monitor-man.sh
