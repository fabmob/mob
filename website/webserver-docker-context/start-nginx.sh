#!/usr/bin/env bash
JSFOLDER=/usr/share/nginx/html/*.js

for file in $JSFOLDER;
do
    envsubst "$(env | cut -d= -f1 | sed -e 's/^/$/')" < $file > $file.tmp && mv $file.tmp $file
done

if [ "$LANDSCAPE" != "preview"  ]
then
    NGINX_CONFIG=/nginx/conf.d/default.conf
    CACHE_CONFIG="location ~* \.(js|json|css|png|jpg|jpeg|gif|ico|woff2)$ {  expires 365d; add_header Cache-Control 'public, no-transform'; root /usr/share/nginx/html;}"
    sed -i "s+##CACHECONFIG+$CACHE_CONFIG+" $NGINX_CONFIG
fi

nginx -g 'daemon off;'
