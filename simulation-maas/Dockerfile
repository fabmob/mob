ARG BASE_IMAGE_NGINX
FROM ${BASE_IMAGE_NGINX}

COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY /build /usr/share/nginx/html
