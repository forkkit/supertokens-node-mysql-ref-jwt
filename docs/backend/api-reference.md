---
id: api-reference
title: API Reference
sidebar_label: API Reference
---

## ```init(config)```
##### Parameters
- ```config```
    - Type: ```object```. To see the fields in this object, visit the [Configurations](config) page 
##### Returns
- ```Promise<void>``` on successful initialization
##### Throws
- ```GENERAL_ERROR```
    - Type: ```{errType: SuperTokens.ERROR.GENERAL_ERROR, err: any}```
    - Examples of when this is thrown is if the library could not connect to the MySQL instance, or if the ```config``` provided is invalid.

<div class="divider"></div>

## ```createNewSession(res, userId, jwtPayload, sessionData)```
##### Important
- Use this only if you are importing from ```supertokens-node-mysql-ref-jwt/express```
##### Parameters
- ```res```
    - Type: ```Express.Response```
- ```userId```
    - Type: ```string```
    - Should be used to ID a user in your system.
- ```jwtPayload``` (Optional)
    - Type: ```object | array | number | string | boolean | any``` 
    - This information is stored in the JWT sent to the frontend, so <span class="highlighted-text">it should not contain any sensitive information.</span>
    - Once set, it cannot be changed during the lifetime of a session.
- ```sessionData``` (Optional)
    - Type: ```object | array | number | string | boolean | any``` 
    - This information is stored only in your database, so <span class="highlighted-text">it can contain sensitive information if needed.</span>
    - This can be freely modified during the lifetime of a session. But we do not synchronize calls to modify this - you must take care of locks yourself.
##### Returns
- ```Promise<Session>``` on successful creation of a session
##### Throws
- ```GENERAL_ERROR```
    - Type: ```{errType: SuperTokens.ERROR.GENERAL_ERROR, err: any}```
    - Examples of when this is thrown is if the library could not connect to the MySQL instance.

<div class="divider"></div>

## ```getSession(req, res)```
##### Important
- Use this only if you are importing from ```supertokens-node-mysql-ref-jwt/express```
##### Parameters
- ```req```
    - Type: ```Express.Request```
- ```res```
    - Type: ```Express.Response```
##### Returns
- ```Promise<Session>``` on successful verification of a session
##### Throws
- ```GENERAL_ERROR```
    - Type: ```{errType: SuperTokens.ERROR.GENERAL_ERROR, err: any}```
    - Examples of when this is thrown is if the library could not connect to the MySQL instance. This will be thrown rarely since it mostly never requires a database call.
- ```UNAUTHORISED```
    - Type: ```{errType: SuperTokens.ERROR.UNAUTHORISED, err: any}```
    - This is thrown if the ```idRefreshToken``` cookie is missing from the ```req``` object.
    - When this is thrown, all the relevant auth cookies are cleared by this function call, so you can redirect the user to a login page.
- ```TRY_REFRESH_TOKEN```
    - Type: ```{errType: SuperTokens.ERROR.TRY_REFRESH_TOKEN, err: any}```
    - This will be thrown if JWT verification fails. This happens, for example, if the token has expired or the JWT signing key has changed.
    - When this is thrown, none of the auth cookies are removed - you should return a ```session expired``` status code and instruct your frontend to call the refresh token API endpoint. If you are using our frontend SDK, then this is taken care for you.

<div class="divider"></div>