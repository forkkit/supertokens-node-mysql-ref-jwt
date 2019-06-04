#!/bin/sh

prettier --write --config .prettierrc "ts/**/*.ts"
prettier --write --config .prettierrc "build/**/*.js"