# SuperTokens
## About
This is a library written in TypeScript that implements user session management for websites that run on NodeJS, Express and MySQL. This is to be used with your backend code. For the frontend implementation using this library, checkout [auth-website!](https://github.com/supertokens/auth-website)

It has the following features:
- It uses short lived access tokens (JWT) and long lived refresh tokens (Opaque)
- The protocol it follows is described in detail in this blog. <TODO: link to blog part 2 at [this]>
- Token theft detection: This library is able to detect token theft in a robust manner. Please see the link mentioned above for more details on how this works. For a more technical understanding, please contact us at <TODO: email>. We will also be writing the Wiki on this repo soon.
- Complete auth token management - It only stores the hashed version of refresh tokens in the database.
- Automatic JWT signing key generation, management and rotation - If you do not provide a key, this library will create one for you and you can also set it so that it changes after a fixed amount of time (for maximum security). The changing of the key will not log any user out.
- Complete cookie management - Takes care of making them secure and HttpOnly. You do not need to change/read/modify cookies yourself.
- Lightweight and clean - 1.4MB minified (203KB GZipped) only! And you only have to create two MySQL tables (one for storing signing keys, and the other for storing session info).
- Efficient in terms of space complexity - Needs to store just one row in a SQL table per logged in user per device.
- Efficient in terms of time complexity - Minimises number of DB lookups:  most requests do not need a database call to authenticate at all!
- Using this library, you can keep a user logged in for however long you want - without worrying about any security concequences.
- In built support for handling multiple devices per user.
- Easy to use and test, with well documented, modularised code and helpful error messages!

## Installation
```bash
npm i --save auth-node-mysql-ref-jwt
```
Before you start using the package:
You will need to create a database in MySQL to store session info. This database can be either your name db, or a new db. Ideally keep it in a new db since that allows for good modularisation. This database name should be given as a config to the library (See config section below)

There will be two tables created in the provided database for you automatically when you first use this library. Instead, if you want to create them yourself, you can do so with the following commands:
```SQL
CREATE TABLE signing_key (
  key_name VARCHAR(128),
  key_value VARCHAR(255),
  created_at_time BIGINT UNSIGNED,
  PRIMARY KEY(key_name)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  session_handle_hash_1 VARCHAR(255) NOT NULL,
  user_id VARCHAR(128) NOT NULL,
  refresh_token_hash_2 VARCHAR(128) NOT NULL,
  session_info TEXT,
  expires_at BIGINT UNSIGNED NOT NULL,
  jwt_user_payload TEXT,
  PRIMARY KEY(session_handle_hash_1)
);    
```
You can call these tables whatever you want, but be sure to send those to the library via the config params (see below).

## Accompanying library
As of now, this library will only work if you frontend is a website. To use this library, you will need to use the [auth-website](https://github.com/supertokens/auth-website) as your frontend code. This library is a drop in replacement for your axios/ajax calls on the frontend.

Together this library and the auth-website library take into account all the various failures and race conditions that can occur when implementing session management.

## Example code & Demo
Before you dive into the usage and the functions for this library, you can play around with the demo project that uses this and the [auth-website](https://github.com/supertokens/auth-website) library. The demo demonstrats how this package behaves when it detects auth token theft (and the best part is that you are the attacker, muahahaha)!

## Usage

### Auth
```js
import * as Auth from 'auth-node-mysql-ref-jwt';
```
#### Auth.init(config)
- To be called while starting your server
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
// @params: sessionData - any js object/array/primitive type to store in the DB for this session. This is changeable throughout the lifetime of this session
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
- To be called when you want to logout a user once they are authenticated in an API.
```js
// @returns a promise
session.revokeSession().then(() => {
  // success. user has been logged out.
}).catch(err => {
  // type of err is Auth.Error Will be GENERAL_ERROR
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
  // type of err is Auth.Error Will be GENERAL_ERROR and UNAUTHORISED
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
  // type of err is Auth.Error Will be GENERAL_ERROR and UNAUTHORISED
});
```
### Auth.Error
This is thrown in many of the functions that are mentioned above. There are three types:
#### GENERAL_ERROR
```js
// here the err will be the actual error generated by whatever caused the error.
// when this error is thrown, you would generally send a 500 status code to your client.
// example for when this is thrown is if your MySQL instance is down.
{errType: Auth.Error.GENERAL_ERROR, err}
```
#### UNAUTHORISED
```js
// here the err will be the actual error generated by whatever caused the error.
// when this error is thrown, you would generally consider this user logged out and would redirect them to a login page or send a session expiry status code
// example for when this is thrown is if the user clears their cookies or they have opened your app after a long time such that their refresh token has expired.
{errType: Auth.Error.UNAUTHORISED, err}
```
#### TRY_REFRESH_TOKEN
```js
// here the err will be the actual error generated by whatever caused the error.
// when this error is thrown, you would generally send a status code that would indicate session expiry.
// example for when this is thrown is if a user's access token has expired
// NOTE: this does not necessarily mean they are logged out! They could have a refresh token that may give them a new access token and then their session could continue.
{errType: Auth.Error.TRY_REFRESH_TOKEN, err}
```
- In a GET API call which returns a rendered html page (for example when using server side rendered ReactJS):
  - If you get an UNAUTHORISED error, redirect to a login page.
  - If you get a TRY_REFRESH_TOKEN error, then send HTML & JS that attempts to call the refreshtoken API via the auth-website package and if that is successful, call the current API again, else redirect to a login page.
- In all other APIs
  - If you get an UNAUTHORISED or TRY_REFRESH_TOKEN error, send a status code that represents session expiry
  
Please see the auth-demo project (https://github.com/supertokens/auth-demo) code to see how to handle these errors in a simple way :grinning:

### Config
The config object has the following shape:
```js
config = {
    mysql: {
        host?: string,  // default localhost
        port?: number, // default 3306
        user: string, // If the tables in the database are not created already, then this user must have permission to create tables.
        password: string,
        connectionLimit?: number, // default 50
        database: string, // name of database to connect to. This must be created before running this package
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
            renewTokenPath: string // this is the api path that needs to be called for refreshing a session. This needs to be a POST API. An example value is "/api/refreshtoken". This will also be the path of the refresh token cookie.
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
    onTokenTheftDetection?: (userId: string, sessionHandle: string) => void; // default undefined. This function is called when a refresh token theft is detected. The userId can be used to log out all devices that have this user signed in. Or the sessionHandle can be used to just logout this particular "stolen session".
}
```
To change the default values or ranges, please see /lib/ts/config.ts file. After making changes, please be sure to compile to JS.

## Making changes
This library is written in TypeScript (TS). When you make any changes to the .ts files in the /lib/ts/* folder, run the following command in the /lib folder to compile to .js:
```bash
tsc -p tsconfig.json
```
If you make any changes to index.ts in the root of this repo, once you compile it to .js, remember to change the import/export path from /lib/ts/* to /lib/build/* in the .js file.

## Future work
- Enable this to work with mobile apps as well.
- Other packages that provide non JWT based implementations for NodeJS and MySQL

## Authors
- Written with :heart: by the folks at SuperTokens. We are a startup passionate about security and solving software challenges in a way that's helpful for everyone! Please feel free to give us feedback at <TODO: email here>, until our website is ready :grinning:

## License
MIT license. For more information, please see the license tab on this repo.
