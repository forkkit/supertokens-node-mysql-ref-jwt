#!/bin/sh

npm install -g prettier@1.17.1

cp pre-commit-hook.sh ../.git/hooks/pre-commit
