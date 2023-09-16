#!/usr/bin/env bash
certbot certonly -n -d $(/opt/elasticbeanstalk/bin/get-config environment -k DOMAIN) --nginx --agree-tos --email rodrigito1991@hotmail.com
