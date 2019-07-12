---
id: api-reference
title: API Reference
sidebar_label: API Reference
---

## Importing
```js
import SuperTokensFetch from "supertokens-website" // When using fetch for API calls
import SuperTokensAxios from "supertokens-website/axios" // When using axios for API calls}
```

<div class="divider"></div>

## ```SuperTokensFetch.init(refreshTokenUrl, sessionExpiredStatusCode?, viaInterceptor?)```
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

## ```SuperTokensFetch.fetch(url, config?)```
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

## ```SuperTokensAxios.init(refreshTokenUrl, sessionExpiredStatusCode?)```
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

## ```SuperTokensAxios.makeSuper(axios)```
##### Important
- Use this only if you are importing from ```supertokens-website/axios```
##### Parameters
- ```axios```
    - The instance of axios to add interceptors to.
    - Each time you create a new instance of axios, you need to call ```makeSuper``` with that instance

<div class="divider"></div>

## ```SuperTokensAxios.axios(data, config?)```
##### Important
- Use this only if you are importing from ```supertokens-website/axios```
##### Parameters
- ```data``` Same as what ```axios()``` expects
    - Type: ```string | object```
    - Either the string url or the config used to make the API.
- ```config``` (Optional) Same as what ```axios()``` expects
    - Type: ```object```
    - Config object used to make the API call.

<div class="divider"></div>

## ```SuperTokensAxios.get(url, config?)```
##### Important
- Use this only if you are importing from ```supertokens-website/axios```
##### Parameters
- ```url```
    - Type: ```string```
    - URL to send a ```GET``` request to
- ```config``` (Optional) - same as what the ```axios.get``` expects.
    - Type: ```object```
##### Returns
- Identical to the ```axios.get``` API.
##### Throws
- Identical to the ```axios.get``` API.
- An ```Error``` object if the ```init``` function is not called.

<div class="divider"></div>

## ```SuperTokensAxios.post(url, data?, config?)```
##### Important
- Use this only if you are importing from ```supertokens-website/axios```
##### Parameters
- ```url```
    - Type: ```string```
    - URL to send a ```POST``` request to
- ```data``` (Optional) - same as what ```axios.post``` expects
    - Type: ```object```
- ```config``` (Optional) - same as what the ```axios.post``` expects.
    - Type: ```object```
##### Returns
- Identical to the ```axios.post``` API.
##### Throws
- Identical to the ```axios.post``` API.
- An ```Error``` object if the ```init``` function is not called.

<div class="divider"></div>

## ```SuperTokensAxios.put(url, config?)```
##### Important
- Use this only if you are importing from ```supertokens-website/axios```
##### Parameters
- ```url```
    - Type: ```string```
    - URL to send a ```PUT``` request to
- ```data``` (Optional) - same as what ```axios.put``` expects
    - Type: ```object```
- ```config``` (Optional) - same as what the ```axios.put``` expects.
    - Type: ```object```
##### Returns
- Identical to the ```axios.put``` API.
##### Throws
- Identical to the ```axios.put``` API.
- An ```Error``` object if the ```init``` function is not called.

<div class="divider"></div>

## ```SuperTokensAxios.delete(url, config?)```
##### Important
- Use this only if you are importing from ```supertokens-website/axios```
##### Parameters
- ```url```
    - Type: ```string```
    - URL to send a ```DELETE``` request to
- ```config``` (Optional) - same as what the ```axios.delete``` expects.
    - Type: ```object```
##### Returns
- Identical to the ```axios.delete``` API.
##### Throws
- Identical to the ```axios.delete``` API.
- An ```Error``` object if the ```init``` function is not called.

<div class="divider"></div>

## ```attemptRefreshingSession()```
Can be used with both axios and fetch
##### Parameters
- none
##### Returns
- ```Promise<boolean>```
- Will be ```true``` if successful. 
- If ```false```, it means the session has expired. You should redirect the user to the login page.
##### Throws
- Identical to the ```fetch``` API.
- An ```Error``` object if the ```init``` function is not called.
