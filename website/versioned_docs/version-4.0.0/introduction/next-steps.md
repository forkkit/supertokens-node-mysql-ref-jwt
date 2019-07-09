---
id: version-4.0.0-next-steps
title: Next Steps
sidebar_label: Next Steps
original_id: next-steps
---

<span class="highlighted-text">For our solution to work, you have to use our backend and frontend libraries.</span> Please follow the backend and frontend installation guides.

## What does the backend SDK do?
- Provides a flexible and intuitive API to manage sessions.
- Manages the database in the context of sessions.
- Various session related processes like creating, destroying or refreshing sessions.
- Handling multiple concurrent requests - process synchronization and race condition handling.

## What does the frontend SDK do?
- Provides a wrapper around http, to make calls to your server end points that require authentication.
- Manages storage of access and refresh tokens.
- When you call an API but your access token has expired, it silently calls your refresh token endpoint to get a new access token and then recalls your original API to give you back the expected result.
- Synchronizes calls to the refresh token API to prevent <a href="https://hackernoon.com/the-best-way-to-securely-manage-user-sessions-91f27eeef460#e81c" target="_blank">this race condition</a>

## Already have your own session management implemented?
Please see our [Migration](../migration/backend) guide.