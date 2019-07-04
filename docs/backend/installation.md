---
id: installation
title: Backend Installation
sidebar_label: Installation
---

### 1. Pre install NodeJS and MySQL
<div style="border: 1px solid #6ab1fd; border-radius: 6px; width: 100%; padding: 20px; display: flex">
<div style="margin-right: 20px;">
<img src="../../img/star.png" style="width: 15px"></img>
</div>
<div style="flex: 1">

<!-- <span style="color: #6ab1fd">Note:</span> For a complete solution, you will also need to use our <a href="../frontend/installation">frontend SDK</a> along with our backend SDK. -->
<!-- Not deleting the code above for reference later -->
<insert-element></insert-element>
</div>
</div>

### 2. Create a database in MySQL that will store session related information
- This could either be your existing app database or a new database. 
- We recommend that you create a new database as it would become easier for you to monitor the data our library stores. An example name for a database is ```auth_session```
- You will have to provide this name in the [Configuration](config) object

### 3. Optionally create tables in the MySQL database
- If you do not create them, our library will create these two tables for you:
  ```SQL
  CREATE TABLE signing_key (
      key_name VARCHAR(128),
      key_value VARCHAR(255),
      created_at_time BIGINT UNSIGNED,
      PRIMARY KEY(key_name)
  );

  CREATE TABLE refresh_tokens (
      session_info TEXT,
      session_handle VARCHAR(255) NOT NULL,
      user_id VARCHAR(128) NOT NULL,
      refresh_token_hash_2 VARCHAR(128) NOT NULL,
      expires_at BIGINT UNSIGNED NOT NULL,
      jwt_user_payload TEXT,
      PRIMARY KEY(session_handle)
  );    
  ```
- Alternatively, you can create these two tables with different names (<span class="highlighted-text">keeping the column names and types the same</span>), and provide these names in the [Configuration](config) object.

### 4. Install SuperTokens package
```js
npm i --save supertokens-node-mysql-ref-jwt
```

### 5. Install cookie-parser package if you are using Express
Our package uses this to set and get cookies from express ```request``` and ```response``` objects.
```js
npm i --save cookie-parser
```