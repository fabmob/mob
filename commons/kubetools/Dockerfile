ARG BASE_IMAGE_UBUNTU
FROM ${BASE_IMAGE_UBUNTU}

RUN apt-get update && \
  apt-get install -y wget curl gettext-base jq && \
  cd /usr/local/bin && \
  wget https://downloads.mongodb.com/compass/mongodb-mongosh_1.4.2_amd64.deb && \
  apt install -y ./mongodb-mongosh_1.4.2_amd64.deb && \
  curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh"  | bash && \
  curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl && \
  chmod +x ./kubectl && \
  curl -L https://github.com/kubernetes/kompose/releases/download/v1.22.0/kompose-linux-amd64 -o kompose && \
  chmod +x ./kompose
ADD ./scripts/* /usr/local/bin/
