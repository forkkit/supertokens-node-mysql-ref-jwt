---
id: initialisation
title: Initialisation & Imports Using Fetch
sidebar_label: Init & Imports Using Fetch
---

## Importing
```js
import SuperTokensRequest from 'supertokens-website';
```

## Call the ```init``` function: [API Reference](api-reference#supertokensfetchinitrefreshtokenurl-sessionexpiredstatuscode-viainterceptor)
```js
SuperTokensRequest.init("https://api.example.com/api/refreshsession", 440, true);
```
- To be called at least once before any http request is made to any of your APIs that require authentication. For example, if your website is a single page ReactJS app, then you can call this in the constructor of the root component.
- If this is not called, other functions will throw an error.
- This function will send a ```POST``` request to the provided API endpoint when needed.

<div class="divider"></div>

## Example code
```js
import SuperTokensRequest from 'supertokens-website';
import React from "react";

class RootComponent extends React.Component {
    constructor() {
        SuperTokensRequest.init("https://api.example.com/api/refreshsession", 440, true);
    }

    render() {
        //...
    }
}

```