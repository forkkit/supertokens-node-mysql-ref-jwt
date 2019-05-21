# SuperTokens
## About
This is a library written in TypeScript that implements user session management for websites that run on NodeJS, express and MySQL. This is to be used with your backend code.

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
- In built support for handling multiple devices per user.
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
There are four modules that you have to interact with: Auth, Config, Session and Auth.Error:

### Auth
```js
import * as Auth from 'auth-node-mysql-ref-jwt';
```
#### Auth.init(config)
- To to be called at the start of your server
```js
// @params config: An object which allows you to set the behaviour of this library. See the Config section below for details on the options.
// @returns a Promise
Auth.init(config).then(() => {
  // Success! Your app can now use this library in any API
}).catch(err => {
  // type of err is Auth.Error Will be GENERAL_ERROR
});
```
#### Auth.createNewSession(res, userId, jwtPayload, sessionData)
- To be called when you want to login a user, after verifying their credentials.
```js
// @params res: express response object
// @params userId: string - some unique ID for this user for you to retrieve in your APIs
// @params: jwtPayload - any js object/array/primitive type to store in the JWT's payload. Once set, it cannot be changed for this session. Also, this should not contain any sensitive data. The advantage of this is that for any API call, you do not need a database lookup to retrieve the information stored here.
// @params: sessionData - any js object/array/primitive type to store in the DB for this session. This is changeable thtoughout the lifetime of this session
// @returns a Promise
Auth.createNewSession(res, "User1", {info: "Data in JWT"}, {info: "Data stored in DB"}).then(session => {
  // session is of type Session class - See below.
}).catch(err => {
  // type of err is Auth.Error Will be GENERAL_ERROR
});
```
#### Auth.getSession(req, res)
- To be called in any API that requires an authenticated user.
```js
// @params req: express request object
// @params res: express response object
// @returns a Promise
Auth.getSession(req, res).then(session => {
  // session is of type Session class.
}).catch(err => {
  // type of err is Auth.Error Will be GENERAL_ERROR, UNAUTHORISED or TRY_REFRESH_TOKEN
  // most of the time, if err is not GENERAL_ERROR, then you should respond with a status code that indicates session expiry. For more details, please see the Auth.Error section below.
});
```
#### Auth.refreshSession(req, res)
- To be called only in the API that is responsible for refreshing your access token. Calls to this API should be handled by the auth-website package.
```js
// @params req: express request object
// @params res: express response object
// @returns a Promise
Auth.refreshSession(req, res).then(session => {
  // session is of type Session class.
}).catch(err => {
  // type of err is Auth.Error Will be GENERAL_ERROR, UNAUTHORISED
  // if err is not GENERAL_ERROR, then you should respond with a status code that indicates session expiry.
});
```
#### Auth.revokeAllSessionsForUser(userId)
- To be called when you want this user to be logged out of all devices. Note that this will not cause immediate logout for this user. The actual time they would be logged out is when their access token expires, and since these are short lived, that should be soon after calling this function
```js
// @params userId: string - a unique ID identifying this user. This ID should be the same as what was passed when calling Auth.createNewSession
// @returns a Promise
Auth.revokeAllSessionsForUser("User1").then(() => {
  // success
}).catch(err => {
  // type of err is Auth.Error Will be GENERAL_ERROR
});
```
#### Auth.revokeSessionUsingSessionHandle(sessionHandle)
- To be called when token theft callback is called (see configs). The callback function will give you a sessionHandle and a userId. Using the sessionHandle, you can logout any device that is using that particular session only. This enables you to keep other devices of this userId still logged in.
```js
// @params sessionHandle: string - a unique ID identifying this session.
// @returns a Promise
Auth.revokeSessionUsingSessionHandle(sessionHandle).then(() => {
  // success
}).catch(err => {
  // type of err is Auth.Error Will be GENERAL_ERROR
});
```

### Config

### Session

### Auth.Error

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
- Written with :heart: by the folks at SuperTokens. We are a startup passionate about security and solving software challenges in a way that's helpful for everyone! Please feel free to give us feedback on <TODO: email here>, until our webiste is ready :grinning:

## License
MIT license. For more information, please see the license tab on this repo.
