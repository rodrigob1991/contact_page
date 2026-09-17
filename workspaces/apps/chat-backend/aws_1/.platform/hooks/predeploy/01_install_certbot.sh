#!/usr/bin/env bash

# install dependencies
dnf install python3 augeas-libs -y &&
# remove OS package if it exist
dnf remove certbot -y &&
# set up python virtual environment
python3 -m venv /opt/certbot/ && /opt/certbot/bin/pip install --upgrade pip &&
# install cerbot within the python virtual environment
/opt/certbot/bin/pip install certbot certbot-nginx && 
# ensure cerbot command can be run
ln -sf /opt/certbot/bin/certbot /usr/bin/certbot

