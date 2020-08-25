# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.6.1](http://github.com//cap-md089/capunit-com-v6/compare/client@1.6.0...client@1.6.1) (2020-08-25)


### Bug Fixes

* fixed "publish to wing calendar" button not appearing for non wing accounts ([b1378c9](http://github.com//cap-md089/capunit-com-v6/commit/b1378c95af2adf3e99179ca0e7646a8f25a7c577)), closes [#10](http://github.com//cap-md089/capunit-com-v6/issues/10)
* fixed calendar crashing when trying to render events that aren't within the viewed month ([e9ff6c7](http://github.com//cap-md089/capunit-com-v6/commit/e9ff6c7a0271eda610ade56ea9722de6c986d46e))
* fixed link event button showing up when already linked to an account ([c3fcb13](http://github.com//cap-md089/capunit-com-v6/commit/c3fcb1346d70724e36be152bc17b8b0eb6fd8112)), closes [#12](http://github.com//cap-md089/capunit-com-v6/issues/12)





# [1.6.0](http://github.com//cap-md089/capunit-com-v6/compare/client@1.5.0...client@1.6.0) (2020-08-17)


### Bug Fixes

* **calendar:** fixed the displayed events not having colors reflect their status ([1be73fd](http://github.com//cap-md089/capunit-com-v6/commit/1be73fd8f02e88d433893797369154038817f6cf)), closes [#8](http://github.com//cap-md089/capunit-com-v6/issues/8)
* added custom remove item labels for all instances of ListEditor ([720c941](http://github.com//cap-md089/capunit-com-v6/commit/720c941e53de270a6fdc3dbb1893b5caa8d6e0dd)), closes [#7](http://github.com//cap-md089/capunit-com-v6/issues/7)
* fixed floats on the main page ([a845c9b](http://github.com//cap-md089/capunit-com-v6/commit/a845c9b33cfa7b9cc55bd6609d03d749fb3d5a21))
* removed wing calendar from wing and region accounts and their events ([8975b7c](http://github.com//cap-md089/capunit-com-v6/commit/8975b7c69efa955f87433244cef7f6460bdc6ae1)), closes [#6](http://github.com//cap-md089/capunit-com-v6/issues/6)
* **eventviewer:** fixed eventviewer updating client side state in a weird way ([aa3b763](http://github.com//cap-md089/capunit-com-v6/commit/aa3b7632b49eb0b65d5bf2481a61c688bd8cbb6b)), closes [#3](http://github.com//cap-md089/capunit-com-v6/issues/3)
* **permissions:** fixed client acting like all members had all permissions ([fcc59ea](http://github.com//cap-md089/capunit-com-v6/commit/fcc59ea127eb7cec3e0973b7f7797f6e6080483f))


### Features

* **prospectivemembers:** added a prospective member management page ([73b07b3](http://github.com//cap-md089/capunit-com-v6/commit/73b07b3b9077ba52e82849a97463225c4a68154d)), closes [#4](http://github.com//cap-md089/capunit-com-v6/issues/4)





## [1.5.1](http://github.com//cap-md089/capunit-com-v6/compare/client@1.5.0...client@1.5.1) (2020-08-13)

**Note:** Version bump only for package client





# [1.5.0](http://github.com//cap-md089/capunit-com-v6/compare/client@1.4.1...client@1.5.0) (2020-08-12)


### Features

* added version checks ([772beae](http://github.com//cap-md089/capunit-com-v6/commit/772beae1ad923db663dfd02c72ddc60f1cc19600))





## [1.4.1](http://github.com//cap-md089/capunit-com-v6/compare/client@1.4.0...client@1.4.1) (2020-08-12)


### Bug Fixes

* **eventviewer:** fixed link event button not appearing in the right place ([ef1bc22](http://github.com//cap-md089/capunit-com-v6/commit/ef1bc228aba0a66e7bd6deb999195d7d255de2a6)), closes [#2](http://github.com//cap-md089/capunit-com-v6/issues/2)
* **eventviewer:** fixed permissions for event viewer, updated style of client ([10af6a5](http://github.com//cap-md089/capunit-com-v6/commit/10af6a5d40800542747943a292419231e4195888))





# 1.4.0 (2020-08-11)


### Bug Fixes

* fixed custom attendance fields not having number be selectable ([ae3ee37](http://github.com//cap-md089/capunit-com-v6/commit/ae3ee37d7458f96e16352ccf6db8dd1bae3d6d6b)), closes [#1](http://github.com//cap-md089/capunit-com-v6/issues/1)
* **eventviewer:** fixed team leaders not being able to sign up to events limited to their team ([ea9ae4a](http://github.com//cap-md089/capunit-com-v6/commit/ea9ae4a520e386f010b1e620a706c1762052c7c4))
* **teams:** fixed team edit and discord role updates ([ef2c7a7](http://github.com//cap-md089/capunit-com-v6/commit/ef2c7a78ddb3d9b8155218eb9540fbdd820e240c))
* Fixed link event not showing up ([143df6f](http://github.com//cap-md089/capunit-com-v6/commit/143df6f6daaf7975fff3e58c68c888a226d8b31a))


### Features

* **eventviewer:** eventViewer now shows all events that are linked to the event being viewed ([979dc77](http://github.com//cap-md089/capunit-com-v6/commit/979dc771ed2b4ce4c652536ea589c0c1de64d3ac))
* **flightcontact:** added C/XO and CDC as people who could get flight contact information ([d731f0f](http://github.com//cap-md089/capunit-com-v6/commit/d731f0f03dcf59fc280445281eabae5174fef8e1))


### Performance Improvements

* fixed Drive/FileDialogue using wrong API ([a08e38b](http://github.com//cap-md089/capunit-com-v6/commit/a08e38bdc9d1d6a0ddf81c6fc40f8bac8a5b57d0))





# [1.3.0](http://github.com//cap-md089/capunit-com-v6/compare/client@1.2.0...client@1.3.0) (2020-08-11)


### Bug Fixes

* fixed custom attendance fields not having number be selectable ([ae3ee37](http://github.com//cap-md089/capunit-com-v6/commit/ae3ee37d7458f96e16352ccf6db8dd1bae3d6d6b)), closes [#1](http://github.com//cap-md089/capunit-com-v6/issues/1)


### Features

* **flightcontact:** added C/XO and CDC as people who could get flight contact information ([d731f0f](http://github.com//cap-md089/capunit-com-v6/commit/d731f0f03dcf59fc280445281eabae5174fef8e1))
