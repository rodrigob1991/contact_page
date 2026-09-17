#!/usr/bin/env bash
dnf update -y && dnf install docker -y && service docker start && systemctl enable docker && usermod -a -G docker ec2-user
