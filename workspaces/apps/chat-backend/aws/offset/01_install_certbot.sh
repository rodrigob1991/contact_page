#!/usr/bin/env bash

EPEL_PACKAGE_NAME="epel"
CERTBOT_PACKAGE_NAME="certbot"

yum update -y &&
yum install grep -y &&
if !(yum list installed | grep -q $EPEL_PACKAGE_NAME); then 
    yum install https://dl.fedoraproject.org/pub/epel/${EPEL_PACKAGE_NAME}-release-latest-7.noarch.rpm -y
fi && 
yum-config-manager --enable epel &&
if !(yum list installed | grep -q $CERTBOT_PACKAGE_NAME); then 
    yum install $CERTBOT_PACKAGE_NAME python3-certbot-nginx -y
fi
