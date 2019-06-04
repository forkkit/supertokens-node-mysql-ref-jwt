#!/bin/sh

_DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
DIR=$( echo $_DIR | sed 's/\/hooks//' )

npm install -g prettier@1.17.1

cp $DIR/hooks/pre-commit-hook.sh $DIR/.git/hooks/pre-commit

chmod +x $DIR/.git/hooks/pre-commit
