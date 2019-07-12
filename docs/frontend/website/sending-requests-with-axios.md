---
id: sending-requests-axios
title: Sending Requests with Axios
sidebar_label: Sending Requests with Axios
---

## With Interceptors

If you call the ```makeSuper``` function using your instance of axios([See initialisation guide](initialisation-with-axios.md)), SuperTokens adds interceptors for requests and responses to axios. Everytime you make an API call using axios SuperTokens does the following:

- Interecpt the request and append the ```anti-CSRF token``` to the header.
- Intercept the response and in case the access token has expired, SuperTokens will automatically call the refresh token endpoint. After recieving the new tokens it will call attempt to call your API.
- Returns the response if successfull, or returns the error if failed.

```js
axios("API URL", config?)
    .then(response => {
        // handle response
    })
    .catch(e => {
        // handle error
    })
```

## Without Interceptors

If you choose not to call the ```makeSuper``` function, you need to change all API calls made with axios with SuperTokens function calls like so:
- ```axios("URL", config) -> SuperTokensRequest.axios("URL", config)```
- ```axios.get("URL", config) -> SuperTokensRequest.get("URL", config)```
- ```axios.post("URL", data, config) -> SuperTokensRequest.post("URL", data, config)```


#### Calling the ```axios``` function: [API Reference](api-reference#fetchurl-config)

```js
SuperTokensRequest.axios("/someAPI", config);
```

- Used to send a request to your API endpoint
- Treat it like a regular ```axios``` API call

<div class="divider"></div>

## Example code
```js
import * as SuperTokensRequest from 'supertokens-website/axios';

const SESSION_EXPIRED_STATUS_CODE = 440;

async function doAPICalls() {
    try {
        let apiConfig = { ... };
        let data = { ... };
        let response = await SuperTokensRequest.post("/someAPI", data, apiConfig);
        let data = await response.data;
        let someField = data.someField;
    } catch (err) {
        if (err.response !== undefined && err.response.status === SESSION_EXPIRED_STATUS_CODE) {
            // redirect usee to login
        }
        // handle error
    }
}
```