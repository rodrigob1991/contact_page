#!/usr/bin/env bash

name="redis"

if ! docker ps --format '{{.Names}}' | grep -w $name &> /dev/null; then
    docker run -p 6379:6379 --name $name --restart unless-stopped -v chat-backend-data:/data -d $name redis-server --appendonly yes
fi
