# SuperTokens
## About
This is a library that implements user session management for websites that run on NodeJS with MySQL. This is to be used with your backend code.

It has the following features:
- It uses short lived access tokens (JWT) and long lived refresh tokens (Opaque)
- The protocol it follows is described here: <TODO: link to blog part 2>
- Token theft detection: The protocol it follows enables it to detect token theft in a robust manner. Please see the link mentioned above for more details on how this happens - for a technical understanding, please contact us on <TODO: email>. We will be writing the Wiki on this repo soon.
- Full auth token management - It only stores the hashed version of refresh tokens in the database
- Automatic JWT signing key generation, management and rotation - If you do not provide a key, this lib will create one for you and you can also set it so that it changes every X interval of time (for maximum security). The changing of the key will not log anyone user out.
- Full cookie management - Takes care of making them secure and HttpOnly. You do not need to change/read/modify cookies yourself.
- Lightweight and clean - Not a lot of code and only two mysql tables (one for storing signing keys, and the other for storing session info)
- Effecient in terms of space complexity - need to store just one session row per logged in user per device.
- Effecient in terms of time complexity - minimises number of db lookups - most requests, do not need a database call to authenticate at all!
- Using this library, you can keep a user logged in for however long you want - without worrying about any security concequences.
- Easy to use and test, with well commented, modularised code and helpful error messages!

## Installation
```bash
npm i --save auth-node-mysql-ref-jwt
```

## Accompanying library
As of now, this library will only work if you frontend is a website. To use this library, you will need to use the following library in your frontend code: https://github.com/supertokens/auth-website. This library is a drop in replacement for your axios/ajax calls on the frontend.

Together this library and the auth-website library take into account all the various failures and race conditions that can occur when implementing session management.

## Example code & Demo
Before we dive into the usage and the functions for this library, please have a look at the open source demo project that uses this and the auth-website library: https://github.com/supertokens/auth-demo. The demo demonstrats how this package behaves when it detects auth token theft (you are the attacker)!

## Usage

## Making changes
This library is written in TypeScript (TS). If you are not familiar with this language, don't worry. It's extremely similar to Javascript. Getting used to TS will take just a few mins. 

That being said, if you make any changes to the .ts files in the /lib/ts/* folder, run the following command in the /lib folder:
```bash
tsc -p tsconfig.json
```
If you make any changes to index.ts in the root of this repo, once you compile it to .js, remember to change the import/export path from /lib/ts/* to /lib/build/* in the .js file.

## Future work
- Enable this to work with mobile apps as well.
- Other packages that provide non JWT based implementations for NodeJS and MySQL

## Authors
- Written with :heart: by the folks at SuperTokens. We are a startup passionate about security and solving software challenges in a way that's helpful for everyone! Please feel free to give us feedback on <TODO: email here>, until our webiste is ready :grinning:MIT

## License
MIT license. For more information, please see the license tab on this repo.
