---
id: website
title: Add SuperTokens to an existing website
sidebar_label: Website
---

### Install the supertokens-website package

```js
npm i --save supertokens-website@^3.0.2
```

For more details visit the [installation](../frontend/website/installation) section

### Using ```fetch``` for API calls

If you use fetch, you can either configure SuperTokens to intercept all API calls or manually replace ```fetch``` calls with SuperTokens function calls.

Using SuperTokens to intercept API calls is easy to setup and does not require any changes to the way you currently make API calls using ```fetch```. SuperTokens handles access token expiry, requesting new tokens and calling the API again after recieving the new tokens.

If you choose to opt out of interceptors you need to replace all API calls that require authentication with functions provided by this package. For example ```fetch("URL")``` would need to be converted to ```SuperTokensRequest.fetch("URL")```. SuperTokens automatically handles calling the refresh token endpoint in case of access token expiry and calls the API again with the new tokens.

For more information on how to integrate SuperTokens with your existing API setup using ```fetch``` please visit the [initialisation guide](../frontend/website/initialisation.md) section.

### Using ```axios``` for API calls

If you use axios, you can use SuperTokens to add interceptors for requests and responses for axios, or you can replace all axios calls with SuperTokens function calls.

Using SuperTokens to intercept axios API calls requires only a single function call. You can use the instance of axios you have already configured for your system. If you create multiple instances of axios over the course of your project, you need to call the SuperTokens ```makeSuper```([reference](../frontend/website/initialisation-with-axios.md#call-the-makesuper-function-api-reference-api-reference-initrefreshtokenurl-sessionexpiredstatuscode)) function for each instance for the package to work correctly.

If you choose to not let SuperTokens intercept API calls, you need to manually replace all axios API calls that require authentication with functions provided by this package. For example ```axios.post("URL", data, config)``` needs to be replaced with ```SuperTokens.post("URL", data, config)```.

For more information on how to integrate SuperTokens with your existing API setup using ```axios``` please visit the [initialisation guide](../frontend/website/initialisation-with-axios.md) section.