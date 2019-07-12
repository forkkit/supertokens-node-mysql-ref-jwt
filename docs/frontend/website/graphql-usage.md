---
id: graphql-usage
title: Usage with GraphQL
sidebar_label: Usage with GraphQL
---

## Usage with Interceptors

You can configure SuperTokens to intercept API calls when initialising the package. The package will then append the ```anti-CSRF token``` to all requests, automatically call the refresh token endpoint in the case of access token expiry and call the API again with the new tokens.

```js
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import { HttpLink } from 'apollo-link-http';
import SuperTokensRequest from 'supertokens-website';

SuperTokensRequest.init("/refreshsession", 440, true);

const client = new ApolloClient({
    link: new HttpLink({
        uri: "/graphql",  // change this depending on your path
    }),
    cache: new InMemoryCache(),  // change this depending on your preference
    // ... other params
});

// use client as usual.
```

## Usage without Interceptors

If you choose to opt out of interceptors using SuperTokens you need to manually change the way the client handles API calls. SuperTokens will automatically call the refresh token endpoint in case of access token expiry and will call the API again with the new tokens.

```js
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import { HttpLink } from 'apollo-link-http';
import SuperTokensRequest from 'supertokens-website';

SuperTokensRequest.init("/refreshsession", 440);

const client = new ApolloClient({
    link: new HttpLink({
        uri: "/graphql",  // change this depending on your path
        fetch: (uri, options) => {
            return SuperTokensRequest.fetch(uri, options);
        }
    }),
    cache: new InMemoryCache(),  // change this depending on your preference
    // ... other params
});

// use client as usual.
```