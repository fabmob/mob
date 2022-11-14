FROM node:16.14.2-alpine

ENV PHANTOMJS_VERSION=2.1.1
ENV PHANTOMJS_PATH=/usr/local/bin/phantomjs
RUN apk update && apk add --no-cache fontconfig ghostscript-fonts curl curl-dev && \
    cd /tmp && curl -Ls https://github.com/dustinblackman/phantomized/releases/download/${PHANTOMJS_VERSION}/dockerized-phantomjs.tar.gz | tar xz && \
    cp -R lib lib64 / && \
    cp -R usr/lib/x86_64-linux-gnu /usr/lib && \
    cp -R usr/share /usr/share && \
    cp -R etc/fonts /etc && \
    curl -k -Ls https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-${PHANTOMJS_VERSION}-linux-x86_64.tar.bz2 | tar -jxf - && \
    cp phantomjs-2.1.1-linux-x86_64/bin/phantomjs /usr/local/bin/phantomjs

# Set to a non-root built-in user `node`
USER node

# Create app directory (with user `node`)
RUN mkdir -p /home/node/app

WORKDIR /home/node/app

# Install app dependencies
COPY --chown=node package.json ./

RUN yarn install

COPY --chown=node . .

RUN rm .npmrc | true
RUN yarn run build

EXPOSE 3000
CMD [ "yarn", "start:watch" ]
