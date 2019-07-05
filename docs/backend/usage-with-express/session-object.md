---
id: session-object
title: Session Object
sidebar_label: Session Object
---

A ```Session``` object is returned when a session is verified successfully. Following are the functions you can use on this ```session``` object:
```js
let session = await SuperTokens.getSession(req, res);
```

## Call the ```getUserId()``` function: [API Reference](../api-reference#sessiongetuserid)
```js
session.getUserId()
```
- This function does not do any database call.

## Call the ```getJWTPayload()``` function: [API Reference](../api-reference#sessiongetjwtpayload)
```js
session.getJWTPayload()
```
- This function does not do any database call.
- It reads the payload available in the JWT access token that was used to verify this session.

## Call the ```revokeSession()``` function: [API Reference](../api-reference#sessionrevokesession)
```js
session.revokeSession()
```
- Please see [User logout](user-logout) section for more information.

## Call the ```getSessionData()``` function: [API Reference](../api-reference#sessiongetsessiondata)
```js
session.getSessionData()
```
- This function requires a database call each time it's called.
- It does nothing to synchronize with other ```getSessionData``` or ```updateSessionData``` calls on this session. So it is up to you to handle various race conditions depending on your use case. 

## Call the ```updateSessionData(data)``` function: [API Reference](../api-reference#sessionupdatesessiondatadata)
```js
session.updateSessionData(data)
```
- This function overrides the current data stored for this session.
- This function requires a database call each time it's called.
- It does nothing to synchronize with other ```getSessionData``` or ```updateSessionData``` calls on this session. So it is up to you to handle various race conditions depending on your use case. 

<div class="divider"></div>

## Example code
```js
import * as SuperTokens from 'supertokens-node-mysql-ref-jwt/express';

async function testSessionAPI(req: express.Request, res: express.Response) {
    let session = await SuperTokens.getSession(req, res);
    let userId = session.getUserId();
    let getJWTPayload = session.getJWTPayload();
    try {
        let sessionData = await session.getSessionData();
        let newSessionData = {...sessionData, joke: "Knock, knock"};
        await session.updateSessionData(newSessionData);
    } catch (err) {
        if (SuperTokens.Error.isErrorFromAuth(err)) {
            if (err.errType === SuperTokens.Error.GENERAL_ERROR) {
                res.status(500).send("Something went wrong");
            } else {    // UNAUTHORISED
                res.redirect("/loginpage");
            }
        } else {
            res.status(500).send(err);  // Something went wrong.
        }
        return;
    }
    try {
        await session.revokeSession();
        // session has been destroyed.
    } catch (err) {
        if (SuperTokens.Error.isErrorFromAuth(err)) {   // GENERAL_ERROR
            if (err.errType === SuperTokens.Error.GENERAL_ERROR) {
                res.status(500).send("Something went wrong");
            }
        } else {
            res.status(500).send(err);  // Something went wrong.
        }
        return;
    }
    res.send("");
}
```
