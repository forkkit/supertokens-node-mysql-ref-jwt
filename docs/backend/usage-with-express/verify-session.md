---
id: verify-session
title: Verify Session
sidebar_label: Verify Session
---


## Call the ```getSession``` function: [API Reference](../api-reference#getsessionreq-res)
```js
SuperTokens.getSession(req, res);
```
- Call this function in any API that requires user authentication.
- You can also use this to build your own middleware. Please see our [Migration](../../migration/migration) guide on how to do this.
- This function will mostly never require a database call since we are using JWT access tokens.
- This function does the following operations:
    - Verifies the current session using the ```req``` object.
    - May change the access token - but this is taken care of by this function. You need to worry about handling this.

<div class="divider"></div>

## Example code
```js
import * as SuperTokens from 'supertokens-node-mysql-ref-jwt/express';

function getHomeFeedAPI(req: express.Request, res: express.Response) {
    SuperTokens.getSession(req, res).then(session => {
        let userId = session.getUserId();
        // rest of API logic...
    }).catch(err => {
        if (SuperTokens.Error.isErrorFromAuth(err)) {
            if (err.errType === SuperTokens.Error.GENERAL_ERROR) {
                res.status(500).send("Something went wrong");
            } else if (err.errType === SuperTokens.Error.UNAUTHORISED) {
                res.redirect("/loginpage");
            } else {    // TRY_REFRESH_TOKEN
                res.status(440).send("Please call refresh token endpoint");
                // Our frontend SDK will take care of calling your refresh token endpoint. Please see the Frontend section to understand how the handling of this works. 
            }
        } else {
            res.status(500).send(err);  // Something went wrong.
        }
    });
}
```
