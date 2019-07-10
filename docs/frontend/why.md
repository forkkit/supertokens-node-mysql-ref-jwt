---
id: why
title: Why is this needed
sidebar_label: Why is this needed
---

- When your access token expires, this library silently and automatically calls your refresh session endpoint so that you do not have to worry about that.
- Manages anti-csrf, access and refresh tokens for you
- Synchronizes with other requests to the refresh token endpoint as to prevent [this](https://hackernoon.com/the-best-way-to-securely-manage-user-sessions-91f27eeef460#e81c) race condition.

## Next steps
- If you have a website, please start by seeing its [Installation guide](website/installation)
- We are currently working on mobile SDKs for Android, iOS and React Native. [Reach out](mailto:team@supertokens.io) to us if you want to know our timeline or suggest more implementations. 