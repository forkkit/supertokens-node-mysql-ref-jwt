---
id: sending-requests
title: Sending Requests
sidebar_label: Sending Requests
---

## Call the ```get``` function: [API Reference](api-reference#geturl-config)
```js
SuperTokensRequest.get("/someGetAPI", config);
```
- Used to send a ```GET``` request to your API endpoint
- Treat it like a regular ```fetch``` API call.

## Call the ```post``` function: [API Reference](api-reference#posturl-config)
```js
SuperTokensRequest.post("/somePostAPI", config);
```
- Used to send a ```POST``` request to your API endpoint
- Treat it like a regular ```fetch``` API call.

## Call the ```put``` function: [API Reference](api-reference#puturl-config)
```js
SuperTokensRequest.post("/somePutAPI", config);
```
- Used to send a ```PUT``` request to your API endpoint
- Treat it like a regular ```fetch``` API call.

## Call the ```delete``` function: [API Reference](api-reference#deleteurl-config)
```js
SuperTokensRequest.post("/someDeleteAPI", config);
```
- Used to send a ```DELETE``` request to your API endpoint
- Treat it like a regular ```fetch``` API call.


## Call the ```doRequest``` function: [API Reference](api-reference#dorequesthttpcall-config)
```js
SuperTokensRequest.doRequest((configWithAntiCsrf) => {
    return fetch(url, {
        method: "PATCH",
        ...configWithAntiCsrf
    });
}, config);
```
- Use this if you want to use a HTTP method that is not mentioned in the list above.
- Treat it like a regular ```fetch``` API call (See example code below).

<div class="divider"></div>

## Example code
```js
import * as SuperTokensRequest from 'supertokens-website';

const SESSION_EXPIRED_STATUS_CODE = 440;

async function doAPICalls() {
    // GET API
    try {
        let fetchConfig = { ... };
        let responseFromGET = await SuperTokensRequest.get("/someGetAPI", fetchConfig);
        if (responseFromGET.status !== 200) {
            throw responseFromGET;
        }
        let data = await responseFromGET.json();
        let someField = data.someField;
    } catch (err) {
        if (err.status === SESSION_EXPIRED_STATUS_CODE) {
            // redirect usee to login
        }
        // handle error
    }

    // POST / DELETE / PUT API
    try {
        let fetchConfig = { ... };
        let responseFromPOST = await SuperTokensRequest.post("/somePostAPI", fetchConfig); // replace post with delete or put for other API calls. 
        if (responseFromPOST.status !== 200) {
            throw responseFromPOST;
        }
        let data = await responseFromPOST.json();
        let someField = data.someField;
    } catch (err) {
        if (err.status === SESSION_EXPIRED_STATUS_CODE) {
            // redirect usee to login
        }
        // handle error
    }

    // using doRequest for PATCH request
    try {
        let fetchConfig = { ... };
        let responseFromPATCH = await AuthHttpRequest.doRequest(config => {
            return fetch("/somePatchAPI", {
                method: "PATCH",
                ...config
            });
        }, fetchConfig);
        if (responseFromPATCH.status !== 200) {
            throw responseFromPATCH;
        }
        let data = await responseFromPATCH.json();
        let someField = data.someField;
    } catch (err) {
        if (err.status === SESSION_EXPIRED_STATUS_CODE) {
            // redirect usee to login
        }
        // handle error
    }
}
```