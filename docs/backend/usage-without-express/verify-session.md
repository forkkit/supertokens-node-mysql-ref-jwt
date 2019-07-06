---
id: verify-session
title: Verify Session
sidebar_label: Verify Session
---


## Call the ```getSession``` function: [API Reference](../api-reference#getsessionaccesstoken-anticsrftoken)
```js
SuperTokens.getSession(accessToken, antiCsrfToken);
```
- Call this function in any API that requires user authentication.
- You can also use this to build your own middleware. Please see our [Migration](../../migration/migration) guide on how to do this.
- This function will mostly never require a database call since we are using JWT access tokens unless ```blacklisting``` is enabled.
- This function does the following operations:
    - Verifies the current session using input tokens.
    - If ```antiCsrfToken``` is not ```undefined```, also gives CSRF protection. We strongly recommend that you use this feature for all your non-GET APIs.
    - May return a new access token. Please see How it works section for more information about this.
- ```accessToken``` can be obtained from the cookies with the key ```sAccessToken```. If this cookie is missing, then you should treat it as an error of type ```TRY_REFRESH_TOKEN```.
- ```antiCsrfToken``` can be obtained from the headers with the key ```anti-csrf```. If this is missing pass ```undefined``` to this function.
- This function may return a ```newAccessToken```. If that happens, please update the access token cookies as mentioned in the [User login](user-login) section.

<div class="divider"></div>

## Example code
```js
import * as SuperTokens from 'supertokens-node-mysql-ref-jwt';

function likeCommentAPI() {
    let accessToken = getCookieValue("sAccessToken");
    if (accessToken === undefined) {
        // access token has probably expired.
        // send session expired response, and call the refresh token API.
        // Our frontend SDK will take care of calling your refresh token endpoint. Please see the Frontend section to understand how the handling of this works. 
        return;
    }
    // This is a POST API. So we also want to protect against CSRF attack
    let antiCsrfToken = getHeaderValue("anti-csrf");
    SuperTokens.getSession(accessToken, antiCsrfToken).then(response => {
        if (response.newAccessToken !== undefined) {
            let newAccessToken = response.newAccessToken;
            setCookie("sAccessToken", newAccessToken.value, "example.com", true, true, 
            new Date(newAccessToken.expires), "/");
        }
        let userId = response.session.userId;
        // rest of API logic...
    }).catch(err => {
        if (SuperTokens.Error.isErrorFromAuth(err)) {
            if (err.errType === SuperTokens.Error.GENERAL_ERROR) {
                // send status code 500
            } else if (err.errType === SuperTokens.Error.UNAUTHORISED) {
                clearAuthCookies();
                // session has expired! You can redirect the user to a login page.
            } else {    // TRY_REFRESH_TOKEN
                // send session expired response, and call the refresh token API.
                // Our frontend SDK will take care of calling your refresh token endpoint. Please see the Frontend section to understand how the handling of this works. 
            }
        } else {
            // send status code 500
        }
    });
}

function clearAuthCookies() {
    // clear sAccessToken, sRefreshToken, sIdRefreshToken
}

function setCookie(key, value, domain, secure, httpOnly, expires, path) {
    // this will be specific to your framework...
}

function getCookieValue(key) {
    // this will be specific to your framework..
}

function getHeaderValue(key) {
    // this will be specific to your framework..
}
```
