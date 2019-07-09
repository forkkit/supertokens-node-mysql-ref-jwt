---
id: version-4.0.0-graphql-usage
title: Usage with GraphQL
sidebar_label: Usage with GraphQL
original_id: graphql-usage
---

## Usage with ```apollo-client``` & ```apollo-link-http```
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
            return SuperTokensRequest.doRequest((optionsWithAntiCsrf) => {
                return fetch(uri, optionsWithAntiCsrf);
            }, options);
        }
    }),
    cache: new InMemoryCache(),  // change this depending on your preference
    // ... other params
});

// use client as usual.
```