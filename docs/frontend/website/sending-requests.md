---
id: sending-requests
title: Sending Requests with Fetch
sidebar_label: Sending Requests with Fetch
---

## With Interceptors

If you set the ```viaInterceptor``` option to ```true``` when initialising SuperTokens ([See initialisation guide](initialisation.md)), the package intercepts all fetch API calls. Then when you make an API call the SuperTokens package will do the following:

- Append the ```anti-CSRF token``` to the request header.
- In case of access token expiry the package will call the refresh token endpoint, store the new tokens in localstorage and then make the request again with the newly recieved tokens.
- Return the response if successful, or return the Error if failed

```js
fetch("API URL", config?)
    .then(response => {
        // handle response
    })
    .catch(e => {
        // handle error
    })
```

## Without Interceptors

If the ```viaInterceptor``` option is ```false``` you need to replace all ```fetch``` calls where you need to use SuperTokens with the ```SuperTokensRequest.fetch``` function call. 


#### Calling the ```fetch``` function: [API Reference](api-reference#fetchurl-config)

```js
SuperTokensRequest.fetch("/someAPI", config);
```

- Used to send a request to your API endpoint
- Treat it like a regular ```fetch``` API call

<div class="divider"></div>

## Example code
```js
import * as SuperTokensRequest from 'supertokens-website';

const SESSION_EXPIRED_STATUS_CODE = 440;

async function doAPICalls() {
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