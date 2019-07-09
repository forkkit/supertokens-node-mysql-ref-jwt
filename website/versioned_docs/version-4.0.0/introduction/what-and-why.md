---
id: version-4.0.0-what-and-why
title: SuperTokens
sidebar_label: What and Why
original_id: what-and-why
---

<span class="highlighted-text">This library works with <b>NodeJS</b> and <b>MySQL</b>.</span> If you are using a different technology stack, please visit the [SuperTokens](https://supertokens.io) home page.

## What does this library do?
- This library implements the most secure session management flow that uses rotating refresh tokens to detect session theft. 
- It uses <span class="highlighted-text">Opaque refresh tokens</span> with <span class="highlighted-text">JWT access tokens</span>.
- Provides an end-to-end solution, handling everything from cookies / headers to your database.
- It has all the standard features you would expect from a session management solution.
- Well modularized, so you can use this as a base for your own solution if needed.


### Why is SuperTokens most secure?
We protect against all session related attacks and vulnerabilities:
- XSS
- Brute force
- CSRF
- Session fixation
- JWT signing key compromise
- Data theft from database
- Session hijacking - we detect stolen tokens.