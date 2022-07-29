ARG BASE_IMAGE_UBUNTU
FROM ${BASE_IMAGE_UBUNTU}
RUN apt-get update && \
  apt-get install -y wget curl ca-certificates gnupg && \
  apt install -y python python3-pip && \
  pip3 install sh && \
  cd /usr/local/bin && \
  wget https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2004-x86_64-100.5.2.deb && \
  apt install -y ./mongodb-database-tools-*-100.5.2.deb && \
  apt-get update
ADD ./scripts/* /usr/local/bin/