#!/usr/bin/env bash

# to use reload with web is needed to expose a reload method
systemctl restart nginx.service && systemctl restart web.service
