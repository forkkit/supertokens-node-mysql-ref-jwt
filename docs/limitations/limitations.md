---
id: limitations
title: Limitations
sidebar_label: Limitations
---

<span class="highlighted-text">Supertokens currently does not support multiple sub-domains.</span>

For example if you have two sub-domains A and B. And user John is logged into both domains.

If domain A refreshes the user tokens for John, domain B would not automatically get the new anti-CSRF token for John. And the next time John tries to access domain B your APIs would be unable to validate John's identity resulting in an authorization error.

<div class="specialNote">
This is because our library uses localstorage to keep track of the anti-CSRF token, and the localstorage for each domain is separate. That being said there are ways to solve this issue.
</div>
<br/>

<span class="highlighted-text">Supertokens currently supports only one instance of MySQL</span>

If you require a solution that works with multiple instances of MySQL please visit the enterprise section of the <a href="https://supertokens.io" class="highlighted-link" target="_blank">SuperTokens website</a>