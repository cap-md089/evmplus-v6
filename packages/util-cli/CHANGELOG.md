# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.14.0](http://github.com//cap-md089/evmplus-v6/compare/util-cli@1.5.8...util-cli@1.14.0) (2021-06-27)


### Bug Fixes

* fixed the build script again ([33729fa](http://github.com//cap-md089/evmplus-v6/commit/33729faab4879548fac63d4428eff30f4956a99d))
* **util-cli:** fixed the handling of newlines inserted by most editors ([2e07f54](http://github.com//cap-md089/evmplus-v6/commit/2e07f54cae31f2e3ad5e53e3b69af30f37d09c0e))
* found that eslint wasn't checking certain files ([25be1cc](http://github.com//cap-md089/evmplus-v6/commit/25be1cc5b028540339a05dc713563b88d226e214))
* got new computer up, and found bugs to fix along the way ([d315858](http://github.com//cap-md089/evmplus-v6/commit/d315858c6662f1cbd921b7a9797bd96b26111bda))
* **client:** re-added full path to URL for pdf generation font files ([bc4bb4a](http://github.com//cap-md089/evmplus-v6/commit/bc4bb4aae648cb52e1d78951f4cf37641caeb30c)), closes [#155](http://github.com//cap-md089/evmplus-v6/issues/155)
* **docker:** fixed docker configuration having syntax errors, added compiler service ([d484f65](http://github.com//cap-md089/evmplus-v6/commit/d484f6562037dd73e12aacbb36b7bec6dfbbf18d))
* **server:** downgraded the MySQL database and driver versions to rollback from bug introduced where ([a3d88cb](http://github.com//cap-md089/evmplus-v6/commit/a3d88cb43d6f189079a25cb0e7c96fa4c91fa31c))
* **util-cli:** fixed a bug where createAccount would not add the mainOrg to the list of org IDs ([2475c9e](http://github.com//cap-md089/evmplus-v6/commit/2475c9e07dcfc2f604b03fdf9d77536865f9830a))
* **util-cli:** fixed CAPWATCH downloads in Docker ([c535a01](http://github.com//cap-md089/evmplus-v6/commit/c535a011fe23edffde323ccf9d256bfb3b8c2b64))
* fixed db upgrade script order ([5ba922c](http://github.com//cap-md089/evmplus-v6/commit/5ba922c4e869f3a52aa442a8ea6adee2110a5637))
* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))
* updated jest dependencies, fixed jest for client ([b98c96a](http://github.com//cap-md089/evmplus-v6/commit/b98c96a97dac6840308775bad73aec6801391690))


### Features

* **util-cli:** added a program to help with generating test data ([5713ef8](http://github.com//cap-md089/evmplus-v6/commit/5713ef8b14e8a4be60d9ca56bc3035ac48fbf255))
* added a script for importing extra CAPWATCH files ([20ac10c](http://github.com//cap-md089/evmplus-v6/commit/20ac10c96282291d380fbfc4c05720046a051b51))
* added nginx configuration for events.md.cap.gov and SSL configuration ([80bdfb8](http://github.com//cap-md089/evmplus-v6/commit/80bdfb8b2800244d184f4370da103757a543d031))
* **client:** added file widget to eventform ([6b01f5f](http://github.com//cap-md089/evmplus-v6/commit/6b01f5fc73312ce411f05eb2be86604cfa0d4fdf))
* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# [1.13.0](http://github.com//cap-md089/evmplus-v6/compare/util-cli@1.5.8...util-cli@1.13.0) (2021-03-15)


### Bug Fixes

* **docker:** fixed docker configuration having syntax errors, added compiler service ([d484f65](http://github.com//cap-md089/evmplus-v6/commit/d484f6562037dd73e12aacbb36b7bec6dfbbf18d))
* **util-cli:** fixed CAPWATCH downloads in Docker ([c535a01](http://github.com//cap-md089/evmplus-v6/commit/c535a011fe23edffde323ccf9d256bfb3b8c2b64))
* fixed db upgrade script order ([5ba922c](http://github.com//cap-md089/evmplus-v6/commit/5ba922c4e869f3a52aa442a8ea6adee2110a5637))
* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))
* updated jest dependencies, fixed jest for client ([b98c96a](http://github.com//cap-md089/evmplus-v6/commit/b98c96a97dac6840308775bad73aec6801391690))


### Features

* added nginx configuration for events.md.cap.gov and SSL configuration ([80bdfb8](http://github.com//cap-md089/evmplus-v6/commit/80bdfb8b2800244d184f4370da103757a543d031))
* **client:** added file widget to eventform ([6b01f5f](http://github.com//cap-md089/evmplus-v6/commit/6b01f5fc73312ce411f05eb2be86604cfa0d4fdf))
* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# [1.12.0](http://github.com//cap-md089/evmplus-v6/compare/util-cli@1.5.8...util-cli@1.12.0) (2020-12-09)


### Bug Fixes

* **server:** fixed headers not being properly handled ([d0829e9](http://github.com//cap-md089/evmplus-v6/commit/d0829e9c94399c402388c26ec05512e53153615b))
* fixed db upgrade script order ([5ba922c](http://github.com//cap-md089/evmplus-v6/commit/5ba922c4e869f3a52aa442a8ea6adee2110a5637))
* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))
* updated jest dependencies, fixed jest for client ([b98c96a](http://github.com//cap-md089/evmplus-v6/commit/b98c96a97dac6840308775bad73aec6801391690))


### Features

* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# [1.11.0](http://github.com//cap-md089/evmplus-v6/compare/util-cli@1.5.8...util-cli@1.11.0) (2020-10-30)


### Bug Fixes

* fixed db upgrade script order ([5ba922c](http://github.com//cap-md089/evmplus-v6/commit/5ba922c4e869f3a52aa442a8ea6adee2110a5637))
* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))
* updated jest dependencies, fixed jest for client ([b98c96a](http://github.com//cap-md089/evmplus-v6/commit/b98c96a97dac6840308775bad73aec6801391690))


### Features

* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# [1.10.0](http://github.com//cap-md089/evmplus-v6/compare/util-cli@1.5.8...util-cli@1.10.0) (2020-10-29)


### Bug Fixes

* fixed db upgrade script order ([5ba922c](http://github.com//cap-md089/evmplus-v6/commit/5ba922c4e869f3a52aa442a8ea6adee2110a5637))
* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))
* updated jest dependencies, fixed jest for client ([b98c96a](http://github.com//cap-md089/evmplus-v6/commit/b98c96a97dac6840308775bad73aec6801391690))


### Features

* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# [1.9.0](http://github.com//cap-md089/evmplus-v6/compare/util-cli@1.5.8...util-cli@1.9.0) (2020-10-27)


### Bug Fixes

* fixed db upgrade script order ([5ba922c](http://github.com//cap-md089/evmplus-v6/commit/5ba922c4e869f3a52aa442a8ea6adee2110a5637))
* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))
* updated jest dependencies, fixed jest for client ([b98c96a](http://github.com//cap-md089/evmplus-v6/commit/b98c96a97dac6840308775bad73aec6801391690))


### Features

* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# [1.8.0](http://github.com//cap-md089/evmplus-v6/compare/util-cli@1.5.8...util-cli@1.8.0) (2020-10-16)


### Bug Fixes

* fixed db upgrade script order ([5ba922c](http://github.com//cap-md089/evmplus-v6/commit/5ba922c4e869f3a52aa442a8ea6adee2110a5637))
* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))


### Features

* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# [1.7.0](http://github.com//cap-md089/evmplus-v6/compare/util-cli@1.5.8...util-cli@1.7.0) (2020-10-08)


### Bug Fixes

* fixed db upgrade script order ([5ba922c](http://github.com//cap-md089/evmplus-v6/commit/5ba922c4e869f3a52aa442a8ea6adee2110a5637))
* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))


### Features

* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# [1.6.0](http://github.com//cap-md089/evmplus-v6/compare/util-cli@1.5.8...util-cli@1.6.0) (2020-10-06)


### Bug Fixes

* fixed db upgrade script order ([5ba922c](http://github.com//cap-md089/evmplus-v6/commit/5ba922c4e869f3a52aa442a8ea6adee2110a5637))
* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))


### Features

* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





## [1.5.8](http://github.com//cap-md089/evmplus-v6/compare/util-cli@1.3.2...util-cli@1.5.8) (2020-09-29)


### Bug Fixes

* removed Wing calendar ([b7f6d84](http://github.com//cap-md089/evmplus-v6/commit/b7f6d84f1a9f203297111d9d2386ee5569434894)), closes [#24](http://github.com//cap-md089/evmplus-v6/issues/24)
* stabilized command line interfaces ([18bc3d0](http://github.com//cap-md089/evmplus-v6/commit/18bc3d0ec4e351c63fe900f51ae5de0cf92e361e))





## [1.5.7](http://github.com//cap-md089/evmplus-v6/compare/util-cli@1.3.2...util-cli@1.5.7) (2020-09-28)


### Bug Fixes

* removed Wing calendar ([b7f6d84](http://github.com//cap-md089/evmplus-v6/commit/b7f6d84f1a9f203297111d9d2386ee5569434894)), closes [#24](http://github.com//cap-md089/evmplus-v6/issues/24)
* stabilized command line interfaces ([18bc3d0](http://github.com//cap-md089/evmplus-v6/commit/18bc3d0ec4e351c63fe900f51ae5de0cf92e361e))





## [1.5.6](http://github.com//cap-md089/evmplus-v6/compare/util-cli@1.3.2...util-cli@1.5.6) (2020-09-27)


### Bug Fixes

* removed Wing calendar ([b7f6d84](http://github.com//cap-md089/evmplus-v6/commit/b7f6d84f1a9f203297111d9d2386ee5569434894)), closes [#24](http://github.com//cap-md089/evmplus-v6/issues/24)
* stabilized command line interfaces ([18bc3d0](http://github.com//cap-md089/evmplus-v6/commit/18bc3d0ec4e351c63fe900f51ae5de0cf92e361e))





## [1.5.5](http://github.com//cap-md089/evmplus-v6/compare/util-cli@1.3.2...util-cli@1.5.5) (2020-09-24)


### Bug Fixes

* removed Wing calendar ([b7f6d84](http://github.com//cap-md089/evmplus-v6/commit/b7f6d84f1a9f203297111d9d2386ee5569434894)), closes [#24](http://github.com//cap-md089/evmplus-v6/issues/24)
* stabilized command line interfaces ([18bc3d0](http://github.com//cap-md089/evmplus-v6/commit/18bc3d0ec4e351c63fe900f51ae5de0cf92e361e))





## [1.5.4](http://github.com//cap-md089/capunit-com-v6/compare/util-cli@1.3.2...util-cli@1.5.4) (2020-09-09)


### Bug Fixes

* removed Wing calendar ([b7f6d84](http://github.com//cap-md089/capunit-com-v6/commit/b7f6d84f1a9f203297111d9d2386ee5569434894)), closes [#24](http://github.com//cap-md089/capunit-com-v6/issues/24)
* stabilized command line interfaces ([18bc3d0](http://github.com//cap-md089/capunit-com-v6/commit/18bc3d0ec4e351c63fe900f51ae5de0cf92e361e))





## [1.5.3](http://github.com//cap-md089/evmplus-v6/compare/util-cli@1.3.2...util-cli@1.5.3) (2020-09-07)

### Bug Fixes

-   removed Wing calendar ([b7f6d84](http://github.com//cap-md089/evmplus-v6/commit/b7f6d84f1a9f203297111d9d2386ee5569434894)), closes [#24](http://github.com//cap-md089/evmplus-v6/issues/24)
-   stabilized command line interfaces ([18bc3d0](http://github.com//cap-md089/evmplus-v6/commit/18bc3d0ec4e351c63fe900f51ae5de0cf92e361e))

## [1.5.2](http://github.com//cap-md089/evmplus-v6/compare/util-cli@1.3.2...util-cli@1.5.2) (2020-09-07)

### Bug Fixes

-   removed Wing calendar ([b7f6d84](http://github.com//cap-md089/evmplus-v6/commit/b7f6d84f1a9f203297111d9d2386ee5569434894)), closes [#24](http://github.com//cap-md089/evmplus-v6/issues/24)
-   stabilized command line interfaces ([18bc3d0](http://github.com//cap-md089/evmplus-v6/commit/18bc3d0ec4e351c63fe900f51ae5de0cf92e361e))

## [1.5.1](http://github.com//cap-md089/evmplus-v6/compare/util-cli@1.3.2...util-cli@1.5.1) (2020-09-06)

### Bug Fixes

-   removed Wing calendar ([b7f6d84](http://github.com//cap-md089/evmplus-v6/commit/b7f6d84f1a9f203297111d9d2386ee5569434894)), closes [#24](http://github.com//cap-md089/evmplus-v6/issues/24)

# [1.5.0](http://github.com//cap-md089/evmplus-v6/compare/util-cli@1.3.2...util-cli@1.5.0) (2020-09-02)

### Features

-   added ability to have Discord bot message a role ([047c7ae](http://github.com//cap-md089/evmplus-v6/commit/047c7ae876e2cac7e52b4466e013a7e1d1a70c9a))

# [1.4.0](http://github.com//cap-md089/evmplus-v6/compare/util-cli@1.3.2...util-cli@1.4.0) (2020-09-01)

### Features

-   added ability to have Discord bot message a role ([047c7ae](http://github.com//cap-md089/evmplus-v6/commit/047c7ae876e2cac7e52b4466e013a7e1d1a70c9a))

## [1.3.4](http://github.com//cap-md089/evmplus-v6/compare/util-cli@1.3.2...util-cli@1.3.4) (2020-08-31)

**Note:** Version bump only for package util-cli

## [1.3.3](http://github.com//cap-md089/evmplus-v6/compare/util-cli@1.3.2...util-cli@1.3.3) (2020-08-25)

**Note:** Version bump only for package util-cli

## [1.3.2](http://github.com//cap-md089/evmplus-v6/compare/util-cli@1.3.0...util-cli@1.3.2) (2020-08-17)

**Note:** Version bump only for package util-cli

## [1.3.1](http://github.com//cap-md089/evmplus-v6/compare/util-cli@1.3.0...util-cli@1.3.1) (2020-08-13)

**Note:** Version bump only for package util-cli

# 1.3.0 (2020-08-11)

### Bug Fixes

-   Fixed link event not showing up ([143df6f](http://github.com//cap-md089/evmplus-v6/commit/143df6f6daaf7975fff3e58c68c888a226d8b31a))
-   updated TypeScript for all packages to 3.9 ([12ee6e6](http://github.com//cap-md089/evmplus-v6/commit/12ee6e67d9669d73d849791cf22637357dd4ae30))

### Features

-   **eventviewer:** eventViewer now shows all events that are linked to the event being viewed ([979dc77](http://github.com//cap-md089/evmplus-v6/commit/979dc771ed2b4ce4c652536ea589c0c1de64d3ac))

# 1.2.0 (2020-08-11)

### Bug Fixes

-   Fixed link event not showing up ([143df6f](http://github.com//cap-md089/evmplus-v6/commit/143df6f6daaf7975fff3e58c68c888a226d8b31a))
-   updated TypeScript for all packages to 3.9 ([12ee6e6](http://github.com//cap-md089/evmplus-v6/commit/12ee6e67d9669d73d849791cf22637357dd4ae30))

### Features

-   **eventviewer:** eventViewer now shows all events that are linked to the event being viewed ([979dc77](http://github.com//cap-md089/evmplus-v6/commit/979dc771ed2b4ce4c652536ea589c0c1de64d3ac))
