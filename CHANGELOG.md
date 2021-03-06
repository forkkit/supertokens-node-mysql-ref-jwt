# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [5.0.4] - 2020-03-12
### Changed
- Makes idRefreshToken secure based on passed config

## [5.0.3] - 2020-03-12
### Added
- Added option to set SameSite cookie in config

## [5.0.2] - 2020-03-03
- Added SameSite attribute to cookies

## [5.0.1] - 2020-02-22
- Added id refresh token to header. It is checked by the frontend to see if the user is logged in.

## [4.4.0] - 2020-01-27
### Added
- allowing ssl config for mysql connection

## [4.3.0] - 2019-08-20
### Added
- For with express implementation: Session.getSessionInfo, Session.updateSessionInfo
- For without express implementation: getSessionInfo, updateSessionInfo

### Deprecated
- For with express implementation: Session.getSessionData, Session.updateSessionData where Session is the session object returned after create new session or get session
- For without express implementation: getSessionData, updateSessionData

## [4.2.0] - 2019-07-23
### Changed
- remove cookie-parser dependecy

### Fixed
- userId bug when a number is passed as string in userId

## [4.1.0] - 2019-07-17
### Fixed
- Throws Auth error if userId is not of correct type
- Adds feature for options API.
- CSRF protection can be disabled (by default it will be enabled)
- userId can be either string or number

## [4.0.4] - 2019-07-15
### Fixed
- Uses accessTokenPath for idRefreshToken as well.

## [4.0.3] - 2019-07-15
### Fixed
- MySQL connection error will now show actual error that was thrown when trying to establish the connection.

## [4.0.2] - 2019-07-14
### Changed
- Adds support for when API is a different subdomain to website URL by using Access-Control-Allow-Credentials, Access-Control-Allow-Headers and Access-Control-Expose-Headers.

## [4.0.1] - 2019-07-12
### Changed
- CSRF protection can be disabled (by default it will be enabled)
- userId can be either string or number

## [4.0.0] - 2019-07-09
### Breaking Changes
- Implements CSRF protection
- Makes handing token theft via an error as opposed to a callback

## [3.0.0] - 2019-06-15
### Breaking Changes
- Reorganises lib so that express related functions are access via /express. By default, you get the raw functions so that you can use them with any non express frameworks as well.
- Stores sessionHandle without hashing in db - results in changing of column name in table

## [2.0.3] - 2019-06-15
### Added
- Does not store hashed version of session handle in database anymore.

## [2.0.2] - 2019-06-14
### Changed
- Adds feature of blacklisting, and if JWT verification fails, then reloads key from DB.

## [2.0.1] - 2019-06-12
### Changed
- Replaces usage of cron with node-cron - to reduce the overall size of this package

## [2.0.0] - 2019-06-07
### Changed
- Changed function signatures in session.ts to remove ```idRefreshToken``` if the function body does not require it. The version has been changed to 2.x.x because indexRaw.ts exposes the functions in session.ts - so any service using that, would break too if version was still 1.x.x

## [1.0.14] - 2019-06-4
### Changed
- Moved the cronjob timing param to the input config object

## [1.0.12] - 2019-05-31
### Changed
- Update readme.
