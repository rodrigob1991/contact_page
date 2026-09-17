#!/usr/bin/env bash

DOMAIN=$(/opt/elasticbeanstalk/bin/get-config environment -k DOMAIN)
PASS_TO_PORT=$(/opt/elasticbeanstalk/bin/get-config environment -k PORT)

echo "server_names_hash_bucket_size 128;  
server {
 listen 443 ssl;
 server_name $DOMAIN;
 
 ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
 ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
 ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
 ssl_ciphers HIGH:!aNULL:!MD5;
 
 	
 proxy_read_timeout 3600s;

 location / {
  proxy_http_version 1.1;
  proxy_pass http://localhost:${PASS_TO_PORT}; 
  proxy_set_header Host \$host;
  proxy_set_header X-Real_IP \$remote_addr;
  proxy_set_header X-Forwarded-for \$remote_addr;
  proxy_set_header Upgrade \$http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Cookie \$http_cookie;
 }
}" > "/var/proxy/staging/nginx/conf.d/websocket.conf"
