#!/bin/sh

# checks if locally staged changes are
# formatted properly. Ignores non-staged
# changes.
# Intended as git pre-commit hook

_DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
DIR=$( echo $_DIR | sed 's/\/.git\/hooks$//' )

#COLOR CODES:
#tput setaf 3 = yellow -> Info
#tput setaf 1 = red -> warning/not allowed commit
#tput setaf 2 = green -> all good!/allowed commit

echo ""
echo "$(tput setaf 3)Running pre-commit hook ... (you can omit this with --no-verify, but don't)$(tput sgr 0)"

echo "$(tput setaf 3)* Stashing non-staged changes if any$(tput sgr 0)"
stashed=$(git stash --keep-index -u)

(cd $DIR/lib/; tsc -p tsconfig.json --noEmit > /dev/null)
compiles=$?

echo "$(tput setaf 3)* Compiles?$(tput sgr 0)"

if [ $compiles -eq 0 ]
then
   echo "$(tput setaf 2)* Yes$(tput sgr 0)"
else
   echo "$(tput setaf 1)* No$(tput sgr 0)"
fi

(cd $DIR/lib/; prettier --check --config .prettierrc "ts/**/*.ts" > /dev/null)
formattedTs=$?
(cd $DIR/lib/; prettier --check --config .prettierrc "build/**/*.js" > /dev/null)
formattedJs=$?

echo "$(tput setaf 3)* Properly formatted?$(tput sgr 0)"

if [ $formattedTs -eq 0 ] && [ $formattedJs -eq 0 ]
then
   echo "$(tput setaf 2)* Yes$(tput sgr 0)"
else
   echo "$(tput setaf 1)* No$(tput sgr 0)"
    echo "$(tput setaf 1)Please run './formatCode.sh in /lib folder' to format the code.$(tput sgr 0)"
    echo ""
fi

if [ $stashed == 'No local changes to save' ]
then
   echo "$(tput setaf 3)* Undoing stashing$(tput sgr 0)"
   git stash apply > /dev/null
   git stash drop > /dev/null
fi

if [ $compiles -eq 0 ] && [ $formattedTs -eq 0 ] && [ $formattedJs -eq 0 ]
then
   echo "$(tput setaf 2)... done. Proceeding with commit.$(tput sgr 0)"
   echo ""
   exit 0
elif [ $compiles -eq 0 ]
then
   echo "$(tput setaf 1)... done.$(tput sgr 0)"
   echo "$(tput setaf 1)CANCELLING commit due to NON-FORMATTED CODE.$(tput sgr 0)"
   echo ""
   exit 1
else
   echo "$(tput setaf 1)... done.$(tput sgr 0)"
   echo "$(tput setaf 1)CANCELLING commit due to COMPILE ERROR.$(tput sgr 0)"
    echo ""
   exit 2
fi