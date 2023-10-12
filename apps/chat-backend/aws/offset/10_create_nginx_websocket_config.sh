#!/usr/bin/env bash

echo "server_names_hash_bucket_size 128;  
server {
 listen 443 ssl;
 server_name chat-backend-env.eba-re2x823v.us-east-1.elasticbeanstalk.com;
 
 ssl_certificate /etc/letsencrypt/live/chat-backend-env.eba-re2x823v.us-east-1.elasticbeanstalk.com/fullchain.pem;
 ssl_certificate_key /etc/letsencrypt/live/chat-backend-env.eba-re2x823v.us-east-1.elasticbeanstalk.com/privkey.pem;
 ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
 ssl_ciphers HIGH:!aNULL:!MD5;

 location / {
  proxy_http_version 1.1;
  proxy_pass http://localhost:5000; 
  proxy_set_header Host $host;
  proxy_set_header X-Real_IP $remote_addr;
  proxy_set_header X-Forwarded-for $remote_addr;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
 }
}" > "/websockettt.conf"
