---
id: api-reference
title: API Reference
sidebar_label: API Reference
---

## ```init(refreshTokenUrl, sessionExpiredStatusCode?, viaInterceptor?)```
##### Parameters
- ```refreshTokenUrl```
    - Type: ```string```
    - Should be the full request URL for your refresh session API endpoint. This function will send a ```POST``` request to it.
- ```sessionExpiredStatusCode``` (Optional)
    - Type: ```number```
    - HTTP status code that indicates session expiry - as sent by your APIs. By default the value is ```440```.
- ```viaInterceptor``` (Optional)
    - Type: ```boolean```
    - If ```true```, all network calls made using ```fetch``` are intercepted by SuperTokens. The package will append ```anti-CSRF tokens``` to the header and handle calling the refresh token endpoint in the case of access token expiry. ```false``` by default.
##### Returns
- nothing
##### Throws
- nothing

<div class="divider"></div>

## ```fetch(url, config?)```
##### Parameters
- ```url```
    - Type: ```string``` - same as what the ```fetch``` expects.
    - URL to send a ```PUT``` request to.
- ```config``` (Optional) - same as what the ```fetch``` expects.
    - Type: ```object```
##### Returns
- Identical to the ```fetch``` API.
##### Throws
- Identical to the ```fetch``` API.
- An ```Error``` object if the ```init``` function is not called.

## ```get(url, config?)```
#### Deprecated: Use fetch instead

<div class="divider"></div>

## ```post(url, config?)```
#### Deprecated: Use fetch instead

<div class="divider"></div>

## ```put(url, config?)```
#### Deprecated: Use fetch instead

<div class="divider"></div>

## ```delete(url, config?)```
#### Deprecated: Use fetch instead

<div class="divider"></div>

## ```attemptRefreshingSession()```
##### Parameters
- none
##### Returns
- ```Promise<boolean>```
- Will be ```true``` if successful. 
- If ```false```, it means the session has expired. You should redirect the user to the login page.
##### Throws
- Identical to the ```fetch``` API.
- An ```Error``` object if the ```init``` function is not called.
