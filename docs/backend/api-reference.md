---
id: api-reference
title: API Reference
sidebar_label: API Reference
---

## ```init(config)```
##### Parameters
- ```config```
    - Has type ```object```. To see the fields in this object, visit the [Configurations](config) page 
##### Returns
- ```Promise<void>``` on successful initialization
##### Throws
- ```GENERAL_ERROR```
    - Has type ```{errType: SuperTokens.ERROR.GENERAL_ERROR, err: any}```
    - Examples of when this is thrown is if the library could not connect to the MySQL instance, or if the ```config``` provided is invalid.

<div class="divider"></div>

## ```createNewSession(res, userId, jwtPayload, sessionData)```
##### Important
- Use this only if you are importing from ```supertokens-node-mysql-ref-jwt/express```
##### Parameters
- ```res```
    - Has type ```Express.Response```
- ```userId```
    - Has type: ```string```
    - Should be used to ID a user in your system.
- ```jwtPayload``` (Optional)
    - Has type: ```object | array | number | string | boolean | any``` 
    - This information is stored in the JWT sent to the frontend, so <span class="highlighted-text">it should not contain any sensitive information.</span>
    - Once set, it cannot be changed during the lifetime of a session.
- ```sessionData``` (Optional)
    - Has type: ```object | array | number | string | boolean | any``` 
    - This information is stored only in your database, so <span class="highlighted-text">it can contain sensitive information if needed.</span>
    - This can be freely modified during the lifetime of a session. But we do not synchronize calls to modify this - you must take care of locks yourself.
##### Returns
- ```Promise<Session>``` on successful creation of a session
##### Throws
- ```GENERAL_ERROR```
    - Has type ```{errType: SuperTokens.ERROR.GENERAL_ERROR, err: any}```
    - Examples of when this is thrown is if the library could not connect to the MySQL instance.

<div class="divider"></div>