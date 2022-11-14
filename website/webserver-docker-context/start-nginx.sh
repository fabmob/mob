#!/usr/bin/env bash
JSFOLDER=/usr/share/nginx/html/*.js

for file in $JSFOLDER;
do
    envsubst "$(env | cut -d= -f1 | sed -e 's/^/$/')" < $file > $file.tmp && mv $file.tmp $file
done

nginx -g 'daemon off;'