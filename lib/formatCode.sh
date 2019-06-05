#!/bin/sh

prettier --write --config .prettierrc "ts/**/*.ts"
prettier --write --config .prettierrc "build/**/*.js"
prettier --write --config .prettierrc "../test/**/*.js"