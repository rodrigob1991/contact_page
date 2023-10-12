#!/bin/bash

at="0 0 1 * *"
command="certbot renew -q"

# this override the entire crontab file of the current user
echo "$at $command" | crontab -
