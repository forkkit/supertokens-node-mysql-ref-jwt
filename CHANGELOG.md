# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
