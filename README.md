![SuperTokens banner](https://raw.githubusercontent.com/supertokens/supertokens-logo/master/images/Artboard%20%E2%80%93%2027%402x.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://github.com/supertokens/supertokens-node-mysql-ref-jwt/blob/master/LICENSE)


This library implements user session management for websites that run on **NodeJS**, **Express** and **MySQL**. This is meant to be used with your backend code. For a complete solution, you also need to use the [supertokens-website](https://github.com/supertokens/supertokens-website) package on your frontend. A demo project that uses these two libraries is available here: [auth-demo](https://github.com/supertokens/auth-demo)

#### The protocol SuperTokens uses is described in detail in [this article](https://medium.com/@supertokens.io/91f27eeef460)

The library has the following features:
- It uses short-lived access tokens (JWT) and long-lived refresh tokens (Opaque)
- Token theft detection: SuperTokens is able to detect token theft in a robust manner. Please see the article mentioned above for details on how this works.
- Complete auth token management - It only stores the hashed version of refresh tokens in the database, so even if someone (an attacker or an employee) gets access to the table containing them, they would not be able to hijack any session. Furthermore, the tokens sent over to the client have a long length and high entropy - so brute force attack is out of the question.
- Automatic JWT signing key generation (if you don't provide one), management and rotation - Periodic changing of this key enables maximum security as you don't have to worry much in the event that this key is compromised. Also note that doing this change will not log any user out :grinning:
- Complete cookie management - Takes care of making them secure and HttpOnly. Also removes, adds and edits them whenever needed. You do not have to worry about cookies and its security anymore!
- Efficient in terms of space complexity - Needs to store just one row in a SQL table per logged in user per device.
- Efficient in terms of time complexity - Minimises the number of DB lookups (most requests do not need a database call to authenticate at all!)
- Built-in support for handling multiple devices per user.
- Built-in synchronisation in case you are running multiple node processes.
- Easy to use (see [auth-demo](https://github.com/supertokens/auth-demo)), with well documented, modularised code and helpful error messages!

#### Using this library, you can keep a user logged in for however long you want - without worrying about any security consequences. For a thorough technical understanding, please contact us at team@supertokens.io.

## Index
1) [Installation](https://github.com/supertokens/supertokens-node-mysql-ref-jwt#installation)
2) [Accompanying library](https://github.com/supertokens/supertokens-node-mysql-ref-jwt#accompanying-library)
3) [Usage](https://github.com/supertokens/supertokens-node-mysql-ref-jwt#usage)
4) [Example code & Demo](https://github.com/supertokens/supertokens-node-mysql-ref-jwt#example-code--demo)
5) [Making changes](https://github.com/supertokens/supertokens-node-mysql-ref-jwt#making-changes)
6) [Future work](https://github.com/supertokens/supertokens-node-mysql-ref-jwt#future-work)
7) [Support, questions and bugs](https://github.com/supertokens/supertokens-node-mysql-ref-jwt#support-questions-and-bugs)
8) [Authors](https://github.com/supertokens/supertokens-node-mysql-ref-jwt#authors)

## Installation
```bash
npm i --save supertokens-node-mysql-ref-jwt
```
Before you start using the package:
You will need to create a database in MySQL to store session info. This database can be either your already created DB or a new DB. This database name should be given as a config param to the library [(See config section below)](https://github.com/supertokens/supertokens-node-mysql-ref-jwt#config).

There will be two tables created automatically for you in the provided database when you first use this library - if they don't already exist. If you want to create them yourself, you can do so with the following commands:
```SQL
CREATE TABLE signing_key (
  key_name VARCHAR(128),
  key_value VARCHAR(255),
  created_at_time BIGINT UNSIGNED,
  PRIMARY KEY(key_name)
);

CREATE TABLE refresh_tokens (
  session_handle_hash_1 VARCHAR(255) NOT NULL,
  user_id VARCHAR(128) NOT NULL,
  refresh_token_hash_2 VARCHAR(128) NOT NULL,
  session_info TEXT,
  expires_at BIGINT UNSIGNED NOT NULL,
  jwt_user_payload TEXT,
  PRIMARY KEY(session_handle_hash_1)
);    
```
You can name these tables whatever you want, but be sure to send those to the library via the config params [(see below)](https://github.com/supertokens/supertokens-node-mysql-ref-jwt#config).

You will also need to use the cookie-parser npm module as a middleware for this library to work:
```js
import * as cookieParser from 'cookie-parser';
app.use(cookieParser());
```

## Accompanying library
As of now, this library will only work if your frontend is a website. To use this library, you will need to use the [supertokens-website](https://github.com/supertokens/supertokens-website) in your frontend code. This library is a drop-in replacement for your axios/ajax calls on the frontend.

Together this library and the supertokens-website library take into account all the failures and race conditions that can possibly occur when implementing session management.

## Usage

### SuperTokens
```js
import * as SuperTokens from 'supertokens-node-mysql-ref-jwt';
```
#### SuperTokens.init(config)
- To be called while starting your server
```js
// @params config: An object which allows you to set the behaviour of this library. See the Config section below for details on the options.
// @returns a Promise
SuperTokens.init(config).then(() => {
  // Success! Your app can now use this library in any API
}).catch(err => {
  // type of err is SuperTokens.Error Will be GENERAL_ERROR
});
```
#### SuperTokens.createNewSession(res, userId, jwtPayload, sessionData)
- To be called when you want to login a user, after verifying their credentials.
```js
// @params res: express response object
// @params userId: string - some unique ID for this user for you to retrieve in your APIs
// @params: jwtPayload - any js object/array/primitive type to store in the JWT's payload. Once set, it cannot be changed for this session. Also, this should not contain any sensitive data. The advantage of this is that for any API call, you do not need a database lookup to retrieve the information stored here.
// @params: sessionData - any js object/array/primitive type to store in the DB for this session. This is changeable throughout the lifetime of this session
// @returns a Promise
SuperTokens.createNewSession(res, "User1", {info: "Data in JWT"}, {info: "Data stored in DB"}).then(session => {
  // session is of type Session class - See below.
}).catch(err => {
  // type of err is SuperTokens.Error Will be GENERAL_ERROR
});
```
#### SuperTokens.getSession(req, res)
- To be called in any API that requires an authenticated user.
```js
// @params req: express request object
// @params res: express response object
// @returns a Promise
SuperTokens.getSession(req, res).then(session => {
  // session is of type Session class.
}).catch(err => {
  // type of err is SuperTokens.Error Will be GENERAL_ERROR, UNAUTHORISED or TRY_REFRESH_TOKEN
  // most of the time, if err is not GENERAL_ERROR, then you should respond with a status code that indicates session expiry. For more details, please see the SuperTokens.Error section below.
});
```
#### SuperTokens.refreshSession(req, res)
- To be called only in the API that is responsible for refreshing your access token. Calls to this API should be handled by the supertokens-website package.
```js
// @params req: express request object
// @params res: express response object
// @returns a Promise
SuperTokens.refreshSession(req, res).then(session => {
  // session is of type Session class.
}).catch(err => {
  // type of err is SuperTokens.Error Will be GENERAL_ERROR, UNAUTHORISED
  // if err is not GENERAL_ERROR, then you should respond with a status code that indicates session expiry.
});
```
#### SuperTokens.revokeAllSessionsForUser(userId)
- To be called when you want this user to be logged out of all devices. Note that this will not cause immediate log out for this user. The actual time they would be logged out is when their access token expires, and since these are short-lived, that should be soon after calling this function.
```js
// @params userId: string - a unique ID identifying this user. This ID should be the same as what was passed when calling SuperTokens.createNewSession
// @returns a Promise
SuperTokens.revokeAllSessionsForUser("User1").then(() => {
  // success
}).catch(err => {
  // type of err is SuperTokens.Error Will be GENERAL_ERROR
});
```
#### SuperTokens.revokeSessionUsingSessionHandle(sessionHandle)
- To be called when the token theft callback is called (see configs). The callback function will give you a sessionHandle and a userId. Using the sessionHandle, you can logout any device that is using that particular session. This enables you to keep other devices of this userId still logged in.
```js
// @params sessionHandle: string - a unique ID identifying this session.
// @returns a Promise
SuperTokens.revokeSessionUsingSessionHandle(sessionHandle).then(() => {
  // success
}).catch(err => {
  // type of err is SuperTokens.Error Will be GENERAL_ERROR
});
```
### Session
An instance of this class will be returned to you from some of the functions mentioned above.
#### session.getUserId()
- To be called when you want to get the unique ID of the user for whom this session was created
```js
// @returns a string
let userId = session.getUserId()
```
#### session.getJWTPayload()
- To be called when you want to get the JWT payload that was set when creating the session
```js
// @returns a js object/array/primitive type - depending on what you passed in createNewSession
let payloadInfo = session.getJWTPayload()
```
#### session.revokeSession()
- To be called when you want to logout a user.
```js
// @returns a promise
session.revokeSession().then(() => {
  // success. user has been logged out.
}).catch(err => {
  // type of err is SuperTokens.Error Will be GENERAL_ERROR
});
```
#### session.getSessionData()
- To be called when you want to get the stored session data from DB. 
- Note that this function does not do any sort of synchronisation with other processes that may want to get/update session data for this session.
```js
// @returns a promise
session.getSessionData().then((data) => {
  // success.
}).catch(err => {
  // type of err is SuperTokens.Error Will be GENERAL_ERROR and UNAUTHORISED
});
```
#### session.updateSessionData()
- To be called when you want to update the stored (in DB) session data. This will overwrite any currently stored data for this session. 
- Note that this function does not do any sort of synchronisation with other processes that may want to get/update session data for this session.
```js
// @params a js object/array/primitive type
// @returns a promise
session.updateSessionData(data).then(() => {
  // success.
}).catch(err => {
  // type of err is SuperTokens.Error Will be GENERAL_ERROR and UNAUTHORISED
});
```
### SuperTokens.Error
This is thrown in many of the functions that are mentioned above. There are of three types:
#### GENERAL_ERROR
```js
// here the err will be the actual error generated by whatever caused the error.
// when this error is thrown, you would generally send a 500 status code to your client.
// example for when this is thrown is if your MySQL instance is down.
{errType: SuperTokens.Error.GENERAL_ERROR, err}
```
#### UNAUTHORISED
```js
// here the err will be the actual error generated by whatever caused the error.
// when this error is thrown, you would generally consider this user logged out and would redirect them to a login page or send a session expiry status code
// example for when this is thrown is if the user clears their cookies or they have opened your app after a long time such that their refresh token has expired.
{errType: SuperTokens.Error.UNAUTHORISED, err}
```
#### TRY_REFRESH_TOKEN
```js
// here the err will be the actual error generated by whatever caused the error.
// when this error is thrown, you would generally send a status code that would indicate session expiry.
// example for when this is thrown is if a user's access token has expired
// NOTE: this does not necessarily mean they are logged out! They could have a refresh token that may give them a new access token and then their session could continue.
{errType: SuperTokens.Error.TRY_REFRESH_TOKEN, err}
```
#### SuperTokens.Error.isErrorFromAuth(err)
```js
// @params err: this is an error object thrown by anything
// @returns true if this error was generated by this SuperTokens library, else false.
// If you call this in TypeScript, then the err object will have a type {errType: number, err: any}
let isErrorGeneratedBySuperTokensLib = SuperTokens.Error.isErrorFromAuth(err)
```
#### In general
- In a GET API call which returns a rendered HTML page (for example when using server-side rendered ReactJS):
  - If you get an UNAUTHORISED error, redirect to a login page.
  - If you get a TRY_REFRESH_TOKEN error, then send HTML & JS that attempts to call the refreshtoken API via the supertokens-website package and if that is successful, call the current API again, else redirect to a login page.
- In all other APIs
  - If you get an UNAUTHORISED or TRY_REFRESH_TOKEN error, send a status code that represents session expiry

### Config
The config object has the following structure:

##### NOTE: If you do not provide a signingKey, it will create one for you and you can also configure it so that it changes after a fixed amount of time (for maximum security). The changing of the key will not log any user out.

```js
config = {
    mysql: {
        host?: string,  // default localhost
        port?: number, // default 3306
        user: string, // If the tables in the database are not created already, then this user must have permission to create tables.
        password: string,
        connectionLimit?: number, // default 50
        database: string, // name of the database to connect to. This must be created before running this package
        tables?: {
            signingKey?: string, // default signing_key - table name used to store secret keys
            refreshTokens?: string // default refresh_token - table name used to store sessions
        }
    },
    tokens: {
        accessToken?: {
            signingKey?: {
                dynamic?: boolean, // default true - if this is true, then the JWT signing key will change automatically ever updateInterval hours.
                updateInterval?: number, // in hours - default 24 - should be >= 1 && <= 720. How often to change the signing key 
                get?: () => Promise<string> // default undefined - If you want to give your own JWT signing key, please give a function here.
            },
            validity?: number // in seconds, default is 3600 seconds. should be >= 10 && <= 86400000 seconds. This determines the lifetime of an access token.
        },
        refreshToken: {
            validity?: number, // in hours, default is 2400 (100 days). This determines how long a refresh token is alive for. So if your user is inactive for these many hours, they will be logged out.
            renewTokenPath: string // this is the API path that needs to be called for refreshing a session. This needs to be a POST API. An example value is "/api/refreshtoken". This will also be the path of the refresh token cookie.
        }
    },
    logging?: {
        info?: (info: any) => void, // default undefined. This function, if provided, will be called for info logging purposes
        error?: (err: any) => void // default undefined. This function, if provided, will be called for error logging purposes
    },
    cookie: {
        domain: string, // this is the domain to set for all the cookies. The path for all cookies except the refresh token will be "/"
        secure?: boolean // default true. Sets if the cookies are secure or not. Ideally, this value should be true in production mode.
    },
    onTokenTheftDetection?: (userId: string, sessionHandle: string) => void; // default undefined. This function is called when a refresh token theft is detected. The userId can be used to log out all devices that have this user signed in. Or the sessionHandle can be used to just log out this particular "stolen session".
}
```
To change the default values or ranges, please see [/lib/ts/config.ts](https://github.com/supertokens/supertokens-node-mysql-ref-jwt/blob/master/lib/ts/config.ts) file.

## Example code & Demo
You can play around with the [demo project](https://github.com/supertokens/auth-demo) that uses this and the [supertokens-website](https://github.com/supertokens/supertokens-website) library. The demo demonstrates how this package behaves when it detects auth token theft (and the best part is that you are the attacker, muahahaha)!

## Making changes
This library is written in TypeScript (TS). When you make any changes to the .ts files in the /lib/ts/* folder, run the following command in the /lib folder to compile to .js:
```bash
tsc -p tsconfig.json
```
If you make any changes to index.ts in the root of this repo, once you compile it to .js, remember to change the import/export path from /lib/ts/* to /lib/build/* in the .js file.

To change the name of the cookies used, please find them in [/lib/ts/cookie.ts](https://github.com/supertokens/supertokens-node-mysql-ref-jwt/blob/master/lib/ts/cookie.ts)

## Future work
- Enable this to work with mobile apps as well.
- Create a WiKi explaining the logic behind how sessions in this library are managed.
- Add unit testing.

## Support, questions and bugs
For now, we are most reachable via team@supertokens.io and via the GitHub issues feature. We will even help you evaluate alternate session management solutions you may be thinking about - so that you end up with the best solution for your use case!

## Authors
Created with :heart: by the folks at SuperTokens. We are a startup passionate about security and solving software challenges in a way that's helpful for everyone! Please feel free to give us feedback at team@supertokens.io, until our website is ready :grinning:
