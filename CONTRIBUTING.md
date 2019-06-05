# Contributing to SuperTokens

Contributions are always welcome. Before contributing please read the code of conduct & search the issue tracker; your issue may have already been discussed or fixed in master. To contribute, fork SuperTokens, commit your changes, & send a pull request.


## Pull Requests
Before issuing a pull request, please make sure:
- There are no typescript compilation issues - we have a pre-commit hook to enforce this
- Code is formatted properly - we have a pre-commit hook to enforce this
- All tests are passing - See below for more details. We will also be running tests when you issue a pull request.

Please only issue pull requests to the dev branch. Upon issuing a request, your version of the repo will be tested automatically.


## Prerequisites

- You will need NodeJS and MySQL on your local system to run and test the repo.

- Install node dependencies
```bash
npm install -d
```

- This repo is written in Typescript. So please install the typescript compiler
```bash
npm install -g typescript
```

- Also run the pre commit installer (This will install prettier as a global npm package):
```bash
sudo -s
cd hooks && ./pre-commit-hook-install.sh
```

## Coding standards
In addition to the following guidelines, please follow the conventions already established in the code.

- **Naming**
Use camel case for all variable names: aNewVariable
Use underscores for sql table names and column names: new_sql_table
Use camel case name for new files: helloWorld.ts
For classes, use camel cases, starting with a capital letter: MyClass
For constants, use all caps with underscores: A_CONSTANT

- **Comments**
Please refrain from commenting very obvious code. But for anything else, please do add comments.
For every function, please write what it returns, if it throws an error (and what type), as well as what the params mean, if they are not obvious.

- **Error handling**
Please only stick to throwing AuthErrors to the client of this repo.

All other issues like quote styles, spacing etc.. will be taken care by the formatter.


## Pre committing checks

1) Make sure to run the typescript compiler
```bash
cd lib && tsc -p tsconfig.json
```

2) Then run the formatter
```bash
cd lib && ./formatCode
```

4) If you have edited ```/index.ts``` or ```/indexRaw.ts```, please make the corresponding changes to ```/index.js``` or ```indexRaw.js```. In the .js files, be sure to change any ```import/export``` statements to use ```/lib/build/``` and not ```/lib/ts``` 


## Pre push

1) Run unit tests and make sure all tests are passing
```bash
npm test
```


