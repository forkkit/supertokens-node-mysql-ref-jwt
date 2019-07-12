---
id: sending-requests
title: Sending Requests with Fetch
sidebar_label: Sending Requests with Fetch
---

## With Interceptors

If you set the ```viaInterceptor``` option to ```true``` when initialising SuperTokens ([See initialisation guide](initialisation.md)), the package intercepts all fetch API calls. Then when you make an API call the SuperTokens package will do the following:

- Append the ```anti-CSRF token``` to the request header.
- In case of access token expiry the package will call the refresh token endpoint, recieve the new tokens and then make the request again with the new tokens.
- Return the response if successful, or return the Error if failed

```js
import SuperTokensRequest from 'supertokens-website';

const SESSION_EXPIRED_STATUS_CODE = 440;

async function doAPICalls() {
    SuperTokensRequest.init("/refreshTokenURL", SESSION_EXPIRED_STATUS_CODE, true);
    try {
        let fetchConfig = { ... };
        let response = await fetch("/someAPI", fetchConfig);
        if (response.status !== 200) {
            throw response;
        }
        let data = await response.json();
        let someField = data.someField;
    } catch (err) {
        if (err.status === SESSION_EXPIRED_STATUS_CODE) {
            // redirect usee to login
        }
        // handle error
    }
}
```

## Without Interceptors

If the ```viaInterceptor``` option is ```false``` you need to replace all ```fetch``` calls that need authentication with the ```SuperTokensRequest.fetch``` function call. 


#### Calling the ```fetch``` function: [API Reference](api-reference#supertokensfetchfetchurl-config)

```js
SuperTokensRequest.fetch("/someAPI", config);
```

- Used to send a request to your API endpoint
- Treat it like a regular ```fetch``` API call
```js
import SuperTokensRequest from 'supertokens-website';

const SESSION_EXPIRED_STATUS_CODE = 440;

async function doAPICalls() {
    SuperTokensRequest.init("/refreshTokenURL", SESSION_EXPIRED_STATUS_CODE, false);
    try {
        let fetchConfig = { ... };
        let response = await SuperTokensRequest.fetch("/someAPI", fetchConfig);
        if (response.status !== 200) {
            throw response;
        }
        let data = await response.json();
        let someField = data.someField;
    } catch (err) {
        if (err.status === SESSION_EXPIRED_STATUS_CODE) {
            // redirect usee to login
        }
        // handle error
    }
}
```