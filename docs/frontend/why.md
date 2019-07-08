---
id: why
title: Why is this needed
sidebar_label: Why is this needed
---

- When you access token expires, this library silently and automatically calls your refresh session endpoint so that you do not have to worry about that.
- Manages anti-csrf, access and refresh tokens for you
- Synchronizes with other requests to the refresh token endpoint as to prevent [this](https://hackernoon.com/the-best-way-to-securely-manage-user-sessions-91f27eeef460#e81c) race condition.