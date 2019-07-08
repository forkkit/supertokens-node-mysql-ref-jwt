---
id: backend
title: Backend Migration
sidebar_label: Backend
---

```js
import * as SuperTokens from 'supertokens-node-mysql-ref-jwt/express';

async function superTokensMiddleware (req, res, next) {
    if ( /* current API is refresh token endpoint */) {
        next();
        return;
    }
    try {
        let session = await SuperTokens.getSession(req, res, true);
        req.superTokensSession = session;
        next();
    } catch (err) {
        if (SuperTokens.Error.isAuthError(err)) {
            if (err.errType === SuperTokens.Error.GENERAL_ERROR) {
                next(err);
            } else if (err.errType === SuperTokens.Error.UNAUTHORISED) {
                // redirect to login page
            } else {    // TRY_REFRESH_TOKEN
                res.status(440).send("Please call the refresh token endpoint");
            }
        } else {
            next(err);
        }
    }
}

app.use(superTokensMiddleware);

// other routes / middlewares
app.use(...);
```