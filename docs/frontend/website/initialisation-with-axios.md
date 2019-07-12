---
id: initialisation-axios
title: Initialisation & Imports Using Axios
sidebar_label: Init & Imports Using Axios
---

## Importing
```js
import SuperTokensRequest from 'supertokens-website/axios';
```

## Call the ```init``` function: [API Reference](api-reference#supertokensaxiosinitrefreshtokenurl-sessionexpiredstatuscode)
```js
SuperTokensRequest.init("https://api.example.com/api/refreshsession", 440);
```
- To be called at least once before any http request is made to any of your APIs that require authentication. For example, if your website is a single page ReactJS app, then you can call this in the constructor of the root component.
- If this is not called, other functions will throw an error.
- This function will send a ```POST``` request to the provided API endpoint when needed.

##### Example code
```js
import SuperTokensRequest from 'supertokens-website/axios';
import React from "react";

class RootComponent extends React.Component {
    constructor() {
        SuperTokensRequest.init("https://api.example.com/api/refreshsession", 440);
    }

    render() {
        //...
    }
}

```

<div class="divider"></div>

## Call the ```makeSuper``` function: [API Reference](api-reference#supertokensaxiosmakesuperaxios)
- The ```makeSuper``` function allows SuperTokens to intercept API requests and responses and handle calling the refresh token endpoint in the case of access token expiry. Calling this method is optional.
- If you choose not to call ```makeSuper``` you will need to manually change all API calls that require authentication to SuperTokens function calls like so:
    - ```axios(url, config) -> SuperTokensRequest.axios(url, config)```
    - ```axios.get(url, config) -> SuperTokensRequest.get(url, config)```
    - ```axios.post(url, data, config) -> SuperTokensRequest.post(url, data, config)```

##### Example code
```js
import axios from "axios";
import SuperTokensRequest from "supertokens-website/axios"

SuperTokensRequest.makeSuper(axios);

```

<div class="specialNote">
Each time you create a new instance of axios, you need to call the <code>makeSuper</code> function for that instance. Calling makeSuper multiple times has no side effect.
</div>