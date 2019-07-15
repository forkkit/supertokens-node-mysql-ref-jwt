---
id: user-login
title: User login
sidebar_label: User login
---

## Call the ```createNewSession``` function: [API Reference](../api-reference#createnewsessionres-userid-jwtpayload-sessiondata)
```js
SuperTokens.createNewSession(res, userId, jwtPayload, sessionData);
```
- Call this function after you have authenticated a user. Authentication can be done via any means: password, social logins, 2FA  etc.
- ```userId``` must be of type ```string``` or ```number```.
- This will override any existing session that exists in the ```res``` object with a new session.
- This function does the following operations:
    - Creates a new access and a new refresh token for this session.
    - This function will set the following cookies and headers in the ```res``` object for you:
        - If ```enableAntiCsrf``` (in the ```config``` object) is set to ```true```, it sets ```anti-csrf``` header that contains an anti-csrf token. This header should be sent for all non-GET API calls that require authentication (except for the refresh session API). 
        - Sets ```sAccessToken``` in cookies with the access token. This cookie has ```HttpOnly``` set to ```true``` and ```secure``` set to ```true``` depending on your passed config. This cookie should be sent for all API calls that require authentication. 
        - Sets ```sRefreshToken``` in cookies containing the refresh token. This cookie has ```HttpOnly``` set to ```true``` and ```secure``` set to ```true``` depending on your passed config. <span class="highlighted-text">This cookie should be sent only to the refresh token API.</span>
        - Sets ```sIdRefreshToken``` in cookies containing a unique ID. Details for why this is needed can be found in the "How it works" section. This cookie has ```HttpOnly``` set to ```false``` and ```secure``` set to ```false```. This cookie should be sent for all API calls that require authentication. 
    - Inserts a new row in the MySQL table for this new session.

<div class="divider"></div>

## Example code
```js
import * as SuperTokens from 'supertokens-node-mysql-ref-jwt/express';

function login(req: express.Request, res: express.Response) {
    // ...
    // assuming user has been authenticated somehow..
    let userId = "User1";
    let jwtPayload = {userId, name: "spooky action at a distance"};
    let sessionData = {awesomeThings: ["programming", "javascript", "SuperTokens"]};
    SuperTokens.createNewSession(res, userId, jwtPayload, sessionData).then(session => {
        res.send("Session created successfully!");
    }).catch(err => {
        // session was not created. Handle error...
    });
}
```