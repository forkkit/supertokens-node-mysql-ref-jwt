---
id: version-4.0.0-api-reference
title: API Reference
sidebar_label: API Reference
original_id: api-reference
---

## ```init(refreshTokenUrl, sessionExpiredStatusCode?)```
##### Parameters
- ```refreshTokenUrl```
    - Type: ```string```
    - Should be the full request URL for your refresh session API endpoint. This function will send a ```POST``` request to it.
- ```sessionExpiredStatusCode``` (Optional)
    - Type: ```number```
    - HTTP status code that indicates session expiry - as sent by your APIs. By default the value is ```440```.
##### Returns
- nothing
##### Throws
- nothing

<div class="divider"></div>

## ```get(url, config?)```
##### Parameters
- ```url```
    - Type: ```string``` - same as what the ```fetch``` expects.
    - URL to send a ```GET``` request to.
- ```config``` (Optional) - same as what the ```fetch``` expects.
    - Type: ```object```
##### Returns
- Identical to the ```fetch``` API.
##### Throws
- Identical to the ```fetch``` API.
- An ```Error``` object if the ```init``` function is not called.

<div class="divider"></div>

## ```post(url, config?)```
##### Parameters
- ```url```
    - Type: ```string``` - same as what the ```fetch``` expects.
    - URL to send a ```POST``` request to.
- ```config``` (Optional) - same as what the ```fetch``` expects.
    - Type: ```object```
##### Returns
- Identical to the ```fetch``` API.
##### Throws
- Identical to the ```fetch``` API.
- An ```Error``` object if the ```init``` function is not called.

<div class="divider"></div>

## ```put(url, config?)```
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

<div class="divider"></div>

## ```delete(url, config?)```
##### Parameters
- ```url```
    - Type: ```string``` - same as what the ```fetch``` expects.
    - URL to send a ```DELETE``` request to.
- ```config``` (Optional) - same as what the ```fetch``` expects.
    - Type: ```object```
##### Returns
- Identical to the ```fetch``` API.
##### Throws
- Identical to the ```fetch``` API.
- An ```Error``` object if the ```init``` function is not called.

<div class="divider"></div>

## ```doRequest(httpCall, config?)```
##### Parameters
- ```httpCall```
    - Type: ```(config?: RequestInit) => Promise<Response>```
    - ```Response``` refers to ```fetch``` response.
- ```config``` (Optional) - same as what the ```fetch``` expects.
    - Type: ```object```
##### Returns
- Identical to the ```fetch``` API.
##### Throws
- Identical to the ```fetch``` API.
- An ```Error``` object if the ```init``` function is not called.

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
