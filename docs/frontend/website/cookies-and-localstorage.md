---
id: cookies-and-localstorage
title: Cookies and Localstorage
sidebar_label: Cookies and Localstorage
---

## Following are the cookies that are used by our system:
- ```sAccessToken```: stores the access token for the current session.
    - ```HttpOnly```: true
    - ```secure```: depends on your backend config
    - ```path```: covers all your APIs that require authentication
    - ```domain```: api domain
- ```sRefreshToken```: stores the refresh token for the current session.
    - ```HttpOnly```: true
    - ```secure```: depends on your backend config
    - ```path```: only your refresh session API
    - ```domain```: api domain
- ```sIdRefreshToken```: stores the id refresh token for the current session.
    - ```HttpOnly```: false
    - ```secure```: false
    - ```path```: covers all your APIs that require authentication
    - ```domain```: api domain
    - The use of this is for the frontend to know when the refresh token or the anti-csrf token has changed so that it can work efficiently. This is no other value in terms of maintaining security.

  ## Following are the localstorage key-values used by our system:
  - ```anti-csrf-localstorage```: stores the current anti-csrf token for this session, unless your backend installation has disabled anti-csrf using SuperTokens.
  - ```browser-tabs-lock-key```: used for storing a lock key that is used to synchronize across all other browser tabs of your app.