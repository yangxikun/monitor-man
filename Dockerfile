FROM centos:latest
LABEL maintainer="yangrokety@gmail.com"
LABEL description="Http api monitor based on newman and postman."

COPY . /root/monitor-man
RUN mv /root/monitor-man/node-v6.11.0-linux-x64.tar.xz /opt/
RUN cd /opt;tar -xvf node-v6.11.0-linux-x64.tar.xz;rm node-v6.11.0-linux-x64.tar.xz
RUN cd /usr/bin;ln -s /opt/node-v6.11.0-linux-x64/bin/* ./
COPY start-monitor-man.sh /root/start-monitor-man.sh

ENTRYPOINT /root/start-monitor-man.sh
