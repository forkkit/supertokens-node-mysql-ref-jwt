#!/bin/bash

_DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
DIR=$( echo $_DIR | sed 's/\/lib//' )

prettier --write --config $DIR/lib/.prettierrc "$DIR/lib/ts/**/*.ts"
prettier --write --config $DIR/lib/.prettierrc "$DIR/lib/build/**/*.js"
prettier --write --config $DIR/lib/.prettierrc "$DIR/test/**/*.js"