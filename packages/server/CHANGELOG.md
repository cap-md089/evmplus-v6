# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [6.24.0](http://github.com//cap-md089/evmplus-v6/compare/evmplus-org-server@6.16.0...evmplus-org-server@6.24.0) (2021-03-15)


### Bug Fixes

* **discord-bot:** tentative fix for duplicate additions of attendance records ([54b7f6a](http://github.com//cap-md089/evmplus-v6/commit/54b7f6a9bc5ec0ef0b50ea7ac03f1a6270c6f2b7))
* **server:** fixed spawning 50-100 Discord connections ([137f223](http://github.com//cap-md089/evmplus-v6/commit/137f2230cdcdc19e59ec063ef3e1d35a363d3083))
* **server:** fixed synchronization issue with fileupload ([c7ad3e2](http://github.com//cap-md089/evmplus-v6/commit/c7ad3e27194e9af7acffd89daae3127fce7a15ff))
* **server:** fixed when finishing account setup or password reset not immediately being signed in as ([f58fa55](http://github.com//cap-md089/evmplus-v6/commit/f58fa5501c3df8d6506e52a07fac25a4781692f3))
* **server:** update email wording to change EvMPlus.org to Event Manager ([8cc0aeb](http://github.com//cap-md089/evmplus-v6/commit/8cc0aeb3dd309012632bc73c1e92314c2176d029))
* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))
* fixed macro error for string enum literal values ([a2d23d0](http://github.com//cap-md089/evmplus-v6/commit/a2d23d0eed2cfef6fa6969b51892e0f0d4734ac2))
* fixed weird configuration bugs ([bc39296](http://github.com//cap-md089/evmplus-v6/commit/bc3929641b0fbc89409f621e3ac0e38b0ab9521e))
* updated jest dependencies, fixed jest for client ([b98c96a](http://github.com//cap-md089/evmplus-v6/commit/b98c96a97dac6840308775bad73aec6801391690))


### Features

* added the events and personalfolders folders ([82f5b48](http://github.com//cap-md089/evmplus-v6/commit/82f5b48feba7638046532ea225cd7ccdb2165b85))
* **client:** redid FileUploader to handle folders, batch uploads, and actual progress past the firs ([6732e46](http://github.com//cap-md089/evmplus-v6/commit/6732e46bfdbcbfa3d38bbcffb1c1308b5239d2d5)), closes [#68](http://github.com//cap-md089/evmplus-v6/issues/68)
* **client and server:** added links and display to view event audit information ([16784ec](http://github.com//cap-md089/evmplus-v6/commit/16784ecb2f8b59f905e548a75a0a8a9c1f7695d9))
* **debriefs:** added debrief functionality to EventViewer and EventLinkList ([42ea511](http://github.com//cap-md089/evmplus-v6/commit/42ea5111f0e985c6a9116007ad4efd40231c8e3e)), closes [#65](http://github.com//cap-md089/evmplus-v6/issues/65)
* **eventform:** added functionality to add internal member as poc by capid ([c6d1021](http://github.com//cap-md089/evmplus-v6/commit/c6d10214f182ad6809c818060203e31436299c99)), closes [#37](http://github.com//cap-md089/evmplus-v6/issues/37)
* **EventForm, viewer, linklist:** added indication of which fields are written to Google Calendar, ([b4a1d64](http://github.com//cap-md089/evmplus-v6/commit/b4a1d6466c4ea66af820b6979a62345966ba392e)), closes [#81](http://github.com//cap-md089/evmplus-v6/issues/81) [#80](http://github.com//cap-md089/evmplus-v6/issues/80)
* **eventviewer:** removed linked events links ([b89016e](http://github.com//cap-md089/evmplus-v6/commit/b89016e158d2ad9c11dc799d372fd6655992fa12))
* **eventviewer and linklist changes in line with mdwg business rules:** eventviewer and linklist ch ([d21210d](http://github.com//cap-md089/evmplus-v6/commit/d21210db05d89a340a3288acad5555cdde01edf6))
* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))


### Performance Improvements

* **server:** added clustering for the server ([00ffd22](http://github.com//cap-md089/evmplus-v6/commit/00ffd2229c7d3195b292e93b0046eb2e1846358d))
* **server:** moved the built client files from the node process to the nginx process ([00ddefb](http://github.com//cap-md089/evmplus-v6/commit/00ddefb01ae85b2ba78e042dc4899e48d2a5d282))
* **server-common:** removed an N+1 query for the querying of the members from an account ([7b54560](http://github.com//cap-md089/evmplus-v6/commit/7b54560ede9f2dd8ec580e6d43855588e8c32ef1))





# [6.23.0](http://github.com//cap-md089/evmplus-v6/compare/evmplus-org-server@6.16.0...evmplus-org-server@6.23.0) (2020-12-09)


### Bug Fixes

* **server-common:** fixed saveExtraMemberInformation not adding information to database when appropr ([cc70767](http://github.com//cap-md089/evmplus-v6/commit/cc7076770ced08b9a115ede1b216f4716ec625af))
* event organizers can now add anyone to attendance so long as they aren't already in attendance; ([416b227](http://github.com//cap-md089/evmplus-v6/commit/416b227d1d6748977c9b7a823c87cf8c79f0f32e))
* **server:** fixed headers not being properly handled ([d0829e9](http://github.com//cap-md089/evmplus-v6/commit/d0829e9c94399c402388c26ec05512e53153615b))
* **server:** updated npm start to use the appropriate node settings ([0839145](http://github.com//cap-md089/evmplus-v6/commit/0839145c01992e7c8c90923979bafe0028eb0a13))
* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))
* fixed macro error for string enum literal values ([a2d23d0](http://github.com//cap-md089/evmplus-v6/commit/a2d23d0eed2cfef6fa6969b51892e0f0d4734ac2))
* updated jest dependencies, fixed jest for client ([b98c96a](http://github.com//cap-md089/evmplus-v6/commit/b98c96a97dac6840308775bad73aec6801391690))


### Features

* **eventform:** added functionality to add internal member as poc by capid ([c6d1021](http://github.com//cap-md089/evmplus-v6/commit/c6d10214f182ad6809c818060203e31436299c99)), closes [#37](http://github.com//cap-md089/evmplus-v6/issues/37)
* **EventForm, viewer, linklist:** added indication of which fields are written to Google Calendar, ([b4a1d64](http://github.com//cap-md089/evmplus-v6/commit/b4a1d6466c4ea66af820b6979a62345966ba392e)), closes [#81](http://github.com//cap-md089/evmplus-v6/issues/81) [#80](http://github.com//cap-md089/evmplus-v6/issues/80)
* **eventviewer and linklist changes in line with mdwg business rules:** eventviewer and linklist ch ([d21210d](http://github.com//cap-md089/evmplus-v6/commit/d21210db05d89a340a3288acad5555cdde01edf6))
* **server:** changed logging for production ([176c3dd](http://github.com//cap-md089/evmplus-v6/commit/176c3dd134cf0255c0bf845e7acb25c5d2ec85d2))
* **server-common:** added extra configuration for different drive locations ([fa8d141](http://github.com//cap-md089/evmplus-v6/commit/fa8d141580c801766af94f405c5e285085c5a885))
* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# [6.22.0](http://github.com//cap-md089/evmplus-v6/compare/evmplus-org-server@6.16.0...evmplus-org-server@6.22.0) (2020-10-30)


### Bug Fixes

* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))
* fixed macro error for string enum literal values ([a2d23d0](http://github.com//cap-md089/evmplus-v6/commit/a2d23d0eed2cfef6fa6969b51892e0f0d4734ac2))
* updated jest dependencies, fixed jest for client ([b98c96a](http://github.com//cap-md089/evmplus-v6/commit/b98c96a97dac6840308775bad73aec6801391690))


### Features

* **eventform:** added functionality to add internal member as poc by capid ([c6d1021](http://github.com//cap-md089/evmplus-v6/commit/c6d10214f182ad6809c818060203e31436299c99)), closes [#37](http://github.com//cap-md089/evmplus-v6/issues/37)
* **EventForm, viewer, linklist:** added indication of which fields are written to Google Calendar, ([b4a1d64](http://github.com//cap-md089/evmplus-v6/commit/b4a1d6466c4ea66af820b6979a62345966ba392e)), closes [#81](http://github.com//cap-md089/evmplus-v6/issues/81) [#80](http://github.com//cap-md089/evmplus-v6/issues/80)
* **eventviewer and linklist changes in line with mdwg business rules:** eventviewer and linklist ch ([d21210d](http://github.com//cap-md089/evmplus-v6/commit/d21210db05d89a340a3288acad5555cdde01edf6))
* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# [6.21.0](http://github.com//cap-md089/evmplus-v6/compare/evmplus-org-server@6.16.0...evmplus-org-server@6.21.0) (2020-10-29)


### Bug Fixes

* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))
* fixed macro error for string enum literal values ([a2d23d0](http://github.com//cap-md089/evmplus-v6/commit/a2d23d0eed2cfef6fa6969b51892e0f0d4734ac2))
* updated jest dependencies, fixed jest for client ([b98c96a](http://github.com//cap-md089/evmplus-v6/commit/b98c96a97dac6840308775bad73aec6801391690))


### Features

* **eventform:** added functionality to add internal member as poc by capid ([c6d1021](http://github.com//cap-md089/evmplus-v6/commit/c6d10214f182ad6809c818060203e31436299c99)), closes [#37](http://github.com//cap-md089/evmplus-v6/issues/37)
* **EventForm, viewer, linklist:** added indication of which fields are written to Google Calendar, ([b4a1d64](http://github.com//cap-md089/evmplus-v6/commit/b4a1d6466c4ea66af820b6979a62345966ba392e)), closes [#81](http://github.com//cap-md089/evmplus-v6/issues/81) [#80](http://github.com//cap-md089/evmplus-v6/issues/80)
* **eventviewer and linklist changes in line with mdwg business rules:** eventviewer and linklist ch ([d21210d](http://github.com//cap-md089/evmplus-v6/commit/d21210db05d89a340a3288acad5555cdde01edf6))
* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# [6.20.0](http://github.com//cap-md089/evmplus-v6/compare/evmplus-org-server@6.16.0...evmplus-org-server@6.20.0) (2020-10-27)


### Bug Fixes

* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))
* fixed macro error for string enum literal values ([a2d23d0](http://github.com//cap-md089/evmplus-v6/commit/a2d23d0eed2cfef6fa6969b51892e0f0d4734ac2))
* updated jest dependencies, fixed jest for client ([b98c96a](http://github.com//cap-md089/evmplus-v6/commit/b98c96a97dac6840308775bad73aec6801391690))


### Features

* **eventform:** added functionality to add internal member as poc by capid ([c6d1021](http://github.com//cap-md089/evmplus-v6/commit/c6d10214f182ad6809c818060203e31436299c99)), closes [#37](http://github.com//cap-md089/evmplus-v6/issues/37)
* **EventForm, viewer, linklist:** added indication of which fields are written to Google Calendar, ([b4a1d64](http://github.com//cap-md089/evmplus-v6/commit/b4a1d6466c4ea66af820b6979a62345966ba392e)), closes [#81](http://github.com//cap-md089/evmplus-v6/issues/81) [#80](http://github.com//cap-md089/evmplus-v6/issues/80)
* **eventviewer and linklist changes in line with mdwg business rules:** eventviewer and linklist ch ([d21210d](http://github.com//cap-md089/evmplus-v6/commit/d21210db05d89a340a3288acad5555cdde01edf6))
* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# [6.19.0](http://github.com//cap-md089/evmplus-v6/compare/evmplus-org-server@6.16.0...evmplus-org-server@6.19.0) (2020-10-16)


### Bug Fixes

* fixed creation of prospective members ([6011736](http://github.com//cap-md089/evmplus-v6/commit/60117367e3c33c9bf37a523f5525e09740034b04))
* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))
* fixed macro error for string enum literal values ([a2d23d0](http://github.com//cap-md089/evmplus-v6/commit/a2d23d0eed2cfef6fa6969b51892e0f0d4734ac2))


### Features

* **EventForm, viewer, linklist:** added indication of which fields are written to Google Calendar, ([b4a1d64](http://github.com//cap-md089/evmplus-v6/commit/b4a1d6466c4ea66af820b6979a62345966ba392e)), closes [#81](http://github.com//cap-md089/evmplus-v6/issues/81) [#80](http://github.com//cap-md089/evmplus-v6/issues/80)
* **eventviewer and linklist changes in line with mdwg business rules:** eventviewer and linklist ch ([d21210d](http://github.com//cap-md089/evmplus-v6/commit/d21210db05d89a340a3288acad5555cdde01edf6))
* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# [6.18.0](http://github.com//cap-md089/evmplus-v6/compare/evmplus-org-server@6.16.0...evmplus-org-server@6.18.0) (2020-10-08)


### Bug Fixes

* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))
* fixed macro error for string enum literal values ([a2d23d0](http://github.com//cap-md089/evmplus-v6/commit/a2d23d0eed2cfef6fa6969b51892e0f0d4734ac2))


### Features

* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# [6.17.0](http://github.com//cap-md089/evmplus-v6/compare/evmplus-org-server@6.16.0...evmplus-org-server@6.17.0) (2020-10-06)


### Bug Fixes

* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))
* fixed macro error for string enum literal values ([a2d23d0](http://github.com//cap-md089/evmplus-v6/commit/a2d23d0eed2cfef6fa6969b51892e0f0d4734ac2))


### Features

* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# 6.16.0 (2020-09-29)


### Bug Fixes

* exported APIs from server so they can be used by util-cli ([96dbbb4](http://github.com//cap-md089/evmplus-v6/commit/96dbbb41c6f1404142cd01ed40d0406c52154a4f))
* fixed error messages for most PAM apis by updating some functions to use AsyncEither ([1e19f85](http://github.com//cap-md089/evmplus-v6/commit/1e19f852ff73ad2cd0a45feed1df15a228b3a1bb))
* fixed event website not displaying on the eventviewer ([9aeb97b](http://github.com//cap-md089/evmplus-v6/commit/9aeb97beff013dc4808e8c481155d95f1d7cd980)), closes [#43](http://github.com//cap-md089/evmplus-v6/issues/43)
* fixed linking events and attendance management ([78cb150](http://github.com//cap-md089/evmplus-v6/commit/78cb150039463240ef89b493d842d185c3b3d36a))
* fixed members not being able to sign up with an email that has an uppercase letter ([33ac3a9](http://github.com//cap-md089/evmplus-v6/commit/33ac3a99677a09b9293800b5c03015db5fdb5535)), closes [#51](http://github.com//cap-md089/evmplus-v6/issues/51)
* fixed user account sign ups ([ebf8821](http://github.com//cap-md089/evmplus-v6/commit/ebf882136c73c1c001ebadacb2945fb543c12854))
* **discord-bot:** fixed not being able to update flight membership ([6c836ad](http://github.com//cap-md089/evmplus-v6/commit/6c836ad9e0d98ab99d8af5bd855972fdcb644c12))
* **eventviewer:** fixed permissions for event viewer, updated style of client ([10af6a5](http://github.com//cap-md089/evmplus-v6/commit/10af6a5d40800542747943a292419231e4195888))
* **permissions:** fixed client acting like all members had all permissions ([fcc59ea](http://github.com//cap-md089/evmplus-v6/commit/fcc59ea127eb7cec3e0973b7f7797f6e6080483f))
* **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/evmplus-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))
* Fixed link event not showing up ([143df6f](http://github.com//cap-md089/evmplus-v6/commit/143df6f6daaf7975fff3e58c68c888a226d8b31a))
* fixed prospectivemember widget on admin page not being able to load prospective members ([e20ffe6](http://github.com//cap-md089/evmplus-v6/commit/e20ffe60ecd1382f656dfe98837cac7162114bda))
* fixed version command on the server ([7388205](http://github.com//cap-md089/evmplus-v6/commit/7388205fd2feb6105e15bbbd43d9cd11dc49c396))
* updated TypeScript for all packages to 3.9 ([12ee6e6](http://github.com//cap-md089/evmplus-v6/commit/12ee6e67d9669d73d849791cf22637357dd4ae30))
* **prospectivemembers:** fixed creation of prospective members ([042b39a](http://github.com//cap-md089/evmplus-v6/commit/042b39af12ad8022ec391c0e8562a83d5211f53b))
* **teamlist:** fixed team managers not being able to see all teams in team list ([20c6da6](http://github.com//cap-md089/evmplus-v6/commit/20c6da60277942133f6ea4e52d6f25b6966ce5a0))
* **teams:** fixed team edit and discord role updates ([ef2c7a7](http://github.com//cap-md089/evmplus-v6/commit/ef2c7a78ddb3d9b8155218eb9540fbdd820e240c))


### Features

* added a way to change the account used at runtime ([d3f484e](http://github.com//cap-md089/evmplus-v6/commit/d3f484ed22836b91a68ef3d976e35079fb04e2c9))
* **signin:** added sign in logging ([c48fd90](http://github.com//cap-md089/evmplus-v6/commit/c48fd904a5b6c3f6a118ff74ebca88dc726dae41)), closes [#26](http://github.com//cap-md089/evmplus-v6/issues/26)
* added attendancescanner ([70f9feb](http://github.com//cap-md089/evmplus-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/evmplus-v6/issues/19)
* added MFA using an OTPA ([900239b](http://github.com//cap-md089/evmplus-v6/commit/900239b673598e22194bd0cb0edbdfef6a3d4cfa))
* added version checks ([772beae](http://github.com//cap-md089/evmplus-v6/commit/772beae1ad923db663dfd02c72ddc60f1cc19600))
* provided better copy event dialogues ([00901ec](http://github.com//cap-md089/evmplus-v6/commit/00901ec4028c18a5d3cabc990439d493f322b14e)), closes [#13](http://github.com//cap-md089/evmplus-v6/issues/13)
* **new:** continued development on cadet promotion requirements ([67c0a78](http://github.com//cap-md089/evmplus-v6/commit/67c0a7891e6fca07454c48a0a182054dd45e87e8))
* adding cadet promotion requirements display ([6659e57](http://github.com//cap-md089/evmplus-v6/commit/6659e571bcf938370ffb0954c053d24f907d24f4))
* **discord-bot:** made discord bot truly optional ([bb8a1f8](http://github.com//cap-md089/evmplus-v6/commit/bb8a1f8e6a5d5b1156141fc1ac5925711fe94bcd))
* **eventviewer:** eventViewer now shows all events that are linked to the event being viewed ([979dc77](http://github.com//cap-md089/evmplus-v6/commit/979dc771ed2b4ce4c652536ea589c0c1de64d3ac))
* **flightcontact:** added C/XO and CDC as people who could get flight contact information ([d731f0f](http://github.com//cap-md089/evmplus-v6/commit/d731f0f03dcf59fc280445281eabae5174fef8e1))
* **prospectivemembers:** added a prospective member management page ([73b07b3](http://github.com//cap-md089/evmplus-v6/commit/73b07b3b9077ba52e82849a97463225c4a68154d)), closes [#4](http://github.com//cap-md089/evmplus-v6/issues/4)





# 6.15.0 (2020-09-28)


### Bug Fixes

* exported APIs from server so they can be used by util-cli ([96dbbb4](http://github.com//cap-md089/evmplus-v6/commit/96dbbb41c6f1404142cd01ed40d0406c52154a4f))
* fixed error messages for most PAM apis by updating some functions to use AsyncEither ([1e19f85](http://github.com//cap-md089/evmplus-v6/commit/1e19f852ff73ad2cd0a45feed1df15a228b3a1bb))
* fixed event website not displaying on the eventviewer ([9aeb97b](http://github.com//cap-md089/evmplus-v6/commit/9aeb97beff013dc4808e8c481155d95f1d7cd980)), closes [#43](http://github.com//cap-md089/evmplus-v6/issues/43)
* fixed linking events and attendance management ([78cb150](http://github.com//cap-md089/evmplus-v6/commit/78cb150039463240ef89b493d842d185c3b3d36a))
* fixed members not being able to sign up with an email that has an uppercase letter ([33ac3a9](http://github.com//cap-md089/evmplus-v6/commit/33ac3a99677a09b9293800b5c03015db5fdb5535)), closes [#51](http://github.com//cap-md089/evmplus-v6/issues/51)
* fixed user account sign ups ([ebf8821](http://github.com//cap-md089/evmplus-v6/commit/ebf882136c73c1c001ebadacb2945fb543c12854))
* **discord-bot:** fixed not being able to update flight membership ([6c836ad](http://github.com//cap-md089/evmplus-v6/commit/6c836ad9e0d98ab99d8af5bd855972fdcb644c12))
* **eventviewer:** fixed permissions for event viewer, updated style of client ([10af6a5](http://github.com//cap-md089/evmplus-v6/commit/10af6a5d40800542747943a292419231e4195888))
* **permissions:** fixed client acting like all members had all permissions ([fcc59ea](http://github.com//cap-md089/evmplus-v6/commit/fcc59ea127eb7cec3e0973b7f7797f6e6080483f))
* **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/evmplus-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))
* Fixed link event not showing up ([143df6f](http://github.com//cap-md089/evmplus-v6/commit/143df6f6daaf7975fff3e58c68c888a226d8b31a))
* fixed prospectivemember widget on admin page not being able to load prospective members ([e20ffe6](http://github.com//cap-md089/evmplus-v6/commit/e20ffe60ecd1382f656dfe98837cac7162114bda))
* fixed version command on the server ([7388205](http://github.com//cap-md089/evmplus-v6/commit/7388205fd2feb6105e15bbbd43d9cd11dc49c396))
* updated TypeScript for all packages to 3.9 ([12ee6e6](http://github.com//cap-md089/evmplus-v6/commit/12ee6e67d9669d73d849791cf22637357dd4ae30))
* **prospectivemembers:** fixed creation of prospective members ([042b39a](http://github.com//cap-md089/evmplus-v6/commit/042b39af12ad8022ec391c0e8562a83d5211f53b))
* **teamlist:** fixed team managers not being able to see all teams in team list ([20c6da6](http://github.com//cap-md089/evmplus-v6/commit/20c6da60277942133f6ea4e52d6f25b6966ce5a0))
* **teams:** fixed team edit and discord role updates ([ef2c7a7](http://github.com//cap-md089/evmplus-v6/commit/ef2c7a78ddb3d9b8155218eb9540fbdd820e240c))


### Features

* added a way to change the account used at runtime ([d3f484e](http://github.com//cap-md089/evmplus-v6/commit/d3f484ed22836b91a68ef3d976e35079fb04e2c9))
* **signin:** added sign in logging ([c48fd90](http://github.com//cap-md089/evmplus-v6/commit/c48fd904a5b6c3f6a118ff74ebca88dc726dae41)), closes [#26](http://github.com//cap-md089/evmplus-v6/issues/26)
* added attendancescanner ([70f9feb](http://github.com//cap-md089/evmplus-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/evmplus-v6/issues/19)
* added MFA using an OTPA ([900239b](http://github.com//cap-md089/evmplus-v6/commit/900239b673598e22194bd0cb0edbdfef6a3d4cfa))
* added version checks ([772beae](http://github.com//cap-md089/evmplus-v6/commit/772beae1ad923db663dfd02c72ddc60f1cc19600))
* provided better copy event dialogues ([00901ec](http://github.com//cap-md089/evmplus-v6/commit/00901ec4028c18a5d3cabc990439d493f322b14e)), closes [#13](http://github.com//cap-md089/evmplus-v6/issues/13)
* **new:** continued development on cadet promotion requirements ([67c0a78](http://github.com//cap-md089/evmplus-v6/commit/67c0a7891e6fca07454c48a0a182054dd45e87e8))
* adding cadet promotion requirements display ([6659e57](http://github.com//cap-md089/evmplus-v6/commit/6659e571bcf938370ffb0954c053d24f907d24f4))
* **discord-bot:** made discord bot truly optional ([bb8a1f8](http://github.com//cap-md089/evmplus-v6/commit/bb8a1f8e6a5d5b1156141fc1ac5925711fe94bcd))
* **eventviewer:** eventViewer now shows all events that are linked to the event being viewed ([979dc77](http://github.com//cap-md089/evmplus-v6/commit/979dc771ed2b4ce4c652536ea589c0c1de64d3ac))
* **flightcontact:** added C/XO and CDC as people who could get flight contact information ([d731f0f](http://github.com//cap-md089/evmplus-v6/commit/d731f0f03dcf59fc280445281eabae5174fef8e1))
* **prospectivemembers:** added a prospective member management page ([73b07b3](http://github.com//cap-md089/evmplus-v6/commit/73b07b3b9077ba52e82849a97463225c4a68154d)), closes [#4](http://github.com//cap-md089/evmplus-v6/issues/4)





# 6.14.0 (2020-09-27)


### Bug Fixes

* exported APIs from server so they can be used by util-cli ([96dbbb4](http://github.com//cap-md089/evmplus-v6/commit/96dbbb41c6f1404142cd01ed40d0406c52154a4f))
* fixed error messages for most PAM apis by updating some functions to use AsyncEither ([1e19f85](http://github.com//cap-md089/evmplus-v6/commit/1e19f852ff73ad2cd0a45feed1df15a228b3a1bb))
* fixed event website not displaying on the eventviewer ([9aeb97b](http://github.com//cap-md089/evmplus-v6/commit/9aeb97beff013dc4808e8c481155d95f1d7cd980)), closes [#43](http://github.com//cap-md089/evmplus-v6/issues/43)
* fixed linking events and attendance management ([78cb150](http://github.com//cap-md089/evmplus-v6/commit/78cb150039463240ef89b493d842d185c3b3d36a))
* fixed members not being able to sign up with an email that has an uppercase letter ([33ac3a9](http://github.com//cap-md089/evmplus-v6/commit/33ac3a99677a09b9293800b5c03015db5fdb5535)), closes [#51](http://github.com//cap-md089/evmplus-v6/issues/51)
* fixed user account sign ups ([ebf8821](http://github.com//cap-md089/evmplus-v6/commit/ebf882136c73c1c001ebadacb2945fb543c12854))
* **discord-bot:** fixed not being able to update flight membership ([6c836ad](http://github.com//cap-md089/evmplus-v6/commit/6c836ad9e0d98ab99d8af5bd855972fdcb644c12))
* **eventviewer:** fixed permissions for event viewer, updated style of client ([10af6a5](http://github.com//cap-md089/evmplus-v6/commit/10af6a5d40800542747943a292419231e4195888))
* **permissions:** fixed client acting like all members had all permissions ([fcc59ea](http://github.com//cap-md089/evmplus-v6/commit/fcc59ea127eb7cec3e0973b7f7797f6e6080483f))
* **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/evmplus-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))
* Fixed link event not showing up ([143df6f](http://github.com//cap-md089/evmplus-v6/commit/143df6f6daaf7975fff3e58c68c888a226d8b31a))
* fixed prospectivemember widget on admin page not being able to load prospective members ([e20ffe6](http://github.com//cap-md089/evmplus-v6/commit/e20ffe60ecd1382f656dfe98837cac7162114bda))
* fixed version command on the server ([7388205](http://github.com//cap-md089/evmplus-v6/commit/7388205fd2feb6105e15bbbd43d9cd11dc49c396))
* updated TypeScript for all packages to 3.9 ([12ee6e6](http://github.com//cap-md089/evmplus-v6/commit/12ee6e67d9669d73d849791cf22637357dd4ae30))
* **prospectivemembers:** fixed creation of prospective members ([042b39a](http://github.com//cap-md089/evmplus-v6/commit/042b39af12ad8022ec391c0e8562a83d5211f53b))
* **teamlist:** fixed team managers not being able to see all teams in team list ([20c6da6](http://github.com//cap-md089/evmplus-v6/commit/20c6da60277942133f6ea4e52d6f25b6966ce5a0))
* **teams:** fixed team edit and discord role updates ([ef2c7a7](http://github.com//cap-md089/evmplus-v6/commit/ef2c7a78ddb3d9b8155218eb9540fbdd820e240c))


### Features

* **signin:** added sign in logging ([c48fd90](http://github.com//cap-md089/evmplus-v6/commit/c48fd904a5b6c3f6a118ff74ebca88dc726dae41)), closes [#26](http://github.com//cap-md089/evmplus-v6/issues/26)
* added attendancescanner ([70f9feb](http://github.com//cap-md089/evmplus-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/evmplus-v6/issues/19)
* added MFA using an OTPA ([900239b](http://github.com//cap-md089/evmplus-v6/commit/900239b673598e22194bd0cb0edbdfef6a3d4cfa))
* added version checks ([772beae](http://github.com//cap-md089/evmplus-v6/commit/772beae1ad923db663dfd02c72ddc60f1cc19600))
* provided better copy event dialogues ([00901ec](http://github.com//cap-md089/evmplus-v6/commit/00901ec4028c18a5d3cabc990439d493f322b14e)), closes [#13](http://github.com//cap-md089/evmplus-v6/issues/13)
* **eventviewer:** eventViewer now shows all events that are linked to the event being viewed ([979dc77](http://github.com//cap-md089/evmplus-v6/commit/979dc771ed2b4ce4c652536ea589c0c1de64d3ac))
* **new:** continued development on cadet promotion requirements ([67c0a78](http://github.com//cap-md089/evmplus-v6/commit/67c0a7891e6fca07454c48a0a182054dd45e87e8))
* adding cadet promotion requirements display ([6659e57](http://github.com//cap-md089/evmplus-v6/commit/6659e571bcf938370ffb0954c053d24f907d24f4))
* **discord-bot:** made discord bot truly optional ([bb8a1f8](http://github.com//cap-md089/evmplus-v6/commit/bb8a1f8e6a5d5b1156141fc1ac5925711fe94bcd))
* **flightcontact:** added C/XO and CDC as people who could get flight contact information ([d731f0f](http://github.com//cap-md089/evmplus-v6/commit/d731f0f03dcf59fc280445281eabae5174fef8e1))
* **prospectivemembers:** added a prospective member management page ([73b07b3](http://github.com//cap-md089/evmplus-v6/commit/73b07b3b9077ba52e82849a97463225c4a68154d)), closes [#4](http://github.com//cap-md089/evmplus-v6/issues/4)





# 6.13.0 (2020-09-24)


### Bug Fixes

* exported APIs from server so they can be used by util-cli ([96dbbb4](http://github.com//cap-md089/evmplus-v6/commit/96dbbb41c6f1404142cd01ed40d0406c52154a4f))
* fixed error messages for most PAM apis by updating some functions to use AsyncEither ([1e19f85](http://github.com//cap-md089/evmplus-v6/commit/1e19f852ff73ad2cd0a45feed1df15a228b3a1bb))
* fixed event website not displaying on the eventviewer ([9aeb97b](http://github.com//cap-md089/evmplus-v6/commit/9aeb97beff013dc4808e8c481155d95f1d7cd980)), closes [#43](http://github.com//cap-md089/evmplus-v6/issues/43)
* fixed linking events and attendance management ([78cb150](http://github.com//cap-md089/evmplus-v6/commit/78cb150039463240ef89b493d842d185c3b3d36a))
* fixed members not being able to sign up with an email that has an uppercase letter ([33ac3a9](http://github.com//cap-md089/evmplus-v6/commit/33ac3a99677a09b9293800b5c03015db5fdb5535)), closes [#51](http://github.com//cap-md089/evmplus-v6/issues/51)
* fixed user account sign ups ([ebf8821](http://github.com//cap-md089/evmplus-v6/commit/ebf882136c73c1c001ebadacb2945fb543c12854))
* **discord-bot:** fixed not being able to update flight membership ([6c836ad](http://github.com//cap-md089/evmplus-v6/commit/6c836ad9e0d98ab99d8af5bd855972fdcb644c12))
* **eventviewer:** fixed permissions for event viewer, updated style of client ([10af6a5](http://github.com//cap-md089/evmplus-v6/commit/10af6a5d40800542747943a292419231e4195888))
* **permissions:** fixed client acting like all members had all permissions ([fcc59ea](http://github.com//cap-md089/evmplus-v6/commit/fcc59ea127eb7cec3e0973b7f7797f6e6080483f))
* **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/evmplus-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))
* Fixed link event not showing up ([143df6f](http://github.com//cap-md089/evmplus-v6/commit/143df6f6daaf7975fff3e58c68c888a226d8b31a))
* fixed prospectivemember widget on admin page not being able to load prospective members ([e20ffe6](http://github.com//cap-md089/evmplus-v6/commit/e20ffe60ecd1382f656dfe98837cac7162114bda))
* fixed version command on the server ([7388205](http://github.com//cap-md089/evmplus-v6/commit/7388205fd2feb6105e15bbbd43d9cd11dc49c396))
* updated TypeScript for all packages to 3.9 ([12ee6e6](http://github.com//cap-md089/evmplus-v6/commit/12ee6e67d9669d73d849791cf22637357dd4ae30))
* **prospectivemembers:** fixed creation of prospective members ([042b39a](http://github.com//cap-md089/evmplus-v6/commit/042b39af12ad8022ec391c0e8562a83d5211f53b))
* **teamlist:** fixed team managers not being able to see all teams in team list ([20c6da6](http://github.com//cap-md089/evmplus-v6/commit/20c6da60277942133f6ea4e52d6f25b6966ce5a0))
* **teams:** fixed team edit and discord role updates ([ef2c7a7](http://github.com//cap-md089/evmplus-v6/commit/ef2c7a78ddb3d9b8155218eb9540fbdd820e240c))


### Features

* **signin:** added sign in logging ([c48fd90](http://github.com//cap-md089/evmplus-v6/commit/c48fd904a5b6c3f6a118ff74ebca88dc726dae41)), closes [#26](http://github.com//cap-md089/evmplus-v6/issues/26)
* added attendancescanner ([70f9feb](http://github.com//cap-md089/evmplus-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/evmplus-v6/issues/19)
* added MFA using an OTPA ([900239b](http://github.com//cap-md089/evmplus-v6/commit/900239b673598e22194bd0cb0edbdfef6a3d4cfa))
* added version checks ([772beae](http://github.com//cap-md089/evmplus-v6/commit/772beae1ad923db663dfd02c72ddc60f1cc19600))
* provided better copy event dialogues ([00901ec](http://github.com//cap-md089/evmplus-v6/commit/00901ec4028c18a5d3cabc990439d493f322b14e)), closes [#13](http://github.com//cap-md089/evmplus-v6/issues/13)
* **eventviewer:** eventViewer now shows all events that are linked to the event being viewed ([979dc77](http://github.com//cap-md089/evmplus-v6/commit/979dc771ed2b4ce4c652536ea589c0c1de64d3ac))
* **new:** continued development on cadet promotion requirements ([67c0a78](http://github.com//cap-md089/evmplus-v6/commit/67c0a7891e6fca07454c48a0a182054dd45e87e8))
* adding cadet promotion requirements display ([6659e57](http://github.com//cap-md089/evmplus-v6/commit/6659e571bcf938370ffb0954c053d24f907d24f4))
* **discord-bot:** made discord bot truly optional ([bb8a1f8](http://github.com//cap-md089/evmplus-v6/commit/bb8a1f8e6a5d5b1156141fc1ac5925711fe94bcd))
* **flightcontact:** added C/XO and CDC as people who could get flight contact information ([d731f0f](http://github.com//cap-md089/evmplus-v6/commit/d731f0f03dcf59fc280445281eabae5174fef8e1))
* **prospectivemembers:** added a prospective member management page ([73b07b3](http://github.com//cap-md089/evmplus-v6/commit/73b07b3b9077ba52e82849a97463225c4a68154d)), closes [#4](http://github.com//cap-md089/evmplus-v6/issues/4)





# 6.12.0 (2020-09-09)


### Bug Fixes

* exported APIs from server so they can be used by util-cli ([96dbbb4](http://github.com//cap-md089/capunit-com-v6/commit/96dbbb41c6f1404142cd01ed40d0406c52154a4f))
* fixed error messages for most PAM apis by updating some functions to use AsyncEither ([1e19f85](http://github.com//cap-md089/capunit-com-v6/commit/1e19f852ff73ad2cd0a45feed1df15a228b3a1bb))
* fixed prospectivemember widget on admin page not being able to load prospective members ([e20ffe6](http://github.com//cap-md089/capunit-com-v6/commit/e20ffe60ecd1382f656dfe98837cac7162114bda))
* fixed user account sign ups ([ebf8821](http://github.com//cap-md089/capunit-com-v6/commit/ebf882136c73c1c001ebadacb2945fb543c12854))
* **discord-bot:** fixed not being able to update flight membership ([6c836ad](http://github.com//cap-md089/capunit-com-v6/commit/6c836ad9e0d98ab99d8af5bd855972fdcb644c12))
* **eventviewer:** fixed permissions for event viewer, updated style of client ([10af6a5](http://github.com//cap-md089/capunit-com-v6/commit/10af6a5d40800542747943a292419231e4195888))
* **permissions:** fixed client acting like all members had all permissions ([fcc59ea](http://github.com//cap-md089/capunit-com-v6/commit/fcc59ea127eb7cec3e0973b7f7797f6e6080483f))
* **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/capunit-com-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))
* fixed version command on the server ([7388205](http://github.com//cap-md089/capunit-com-v6/commit/7388205fd2feb6105e15bbbd43d9cd11dc49c396))
* updated TypeScript for all packages to 3.9 ([12ee6e6](http://github.com//cap-md089/capunit-com-v6/commit/12ee6e67d9669d73d849791cf22637357dd4ae30))
* **prospectivemembers:** fixed creation of prospective members ([042b39a](http://github.com//cap-md089/capunit-com-v6/commit/042b39af12ad8022ec391c0e8562a83d5211f53b))
* **teamlist:** fixed team managers not being able to see all teams in team list ([20c6da6](http://github.com//cap-md089/capunit-com-v6/commit/20c6da60277942133f6ea4e52d6f25b6966ce5a0))
* **teams:** fixed team edit and discord role updates ([ef2c7a7](http://github.com//cap-md089/capunit-com-v6/commit/ef2c7a78ddb3d9b8155218eb9540fbdd820e240c))
* Fixed link event not showing up ([143df6f](http://github.com//cap-md089/capunit-com-v6/commit/143df6f6daaf7975fff3e58c68c888a226d8b31a))


### Features

* added attendancescanner ([70f9feb](http://github.com//cap-md089/capunit-com-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/capunit-com-v6/issues/19)
* added MFA using an OTPA ([900239b](http://github.com//cap-md089/capunit-com-v6/commit/900239b673598e22194bd0cb0edbdfef6a3d4cfa))
* added version checks ([772beae](http://github.com//cap-md089/capunit-com-v6/commit/772beae1ad923db663dfd02c72ddc60f1cc19600))
* adding cadet promotion requirements display ([6659e57](http://github.com//cap-md089/capunit-com-v6/commit/6659e571bcf938370ffb0954c053d24f907d24f4))
* provided better copy event dialogues ([00901ec](http://github.com//cap-md089/capunit-com-v6/commit/00901ec4028c18a5d3cabc990439d493f322b14e)), closes [#13](http://github.com//cap-md089/capunit-com-v6/issues/13)
* **discord-bot:** made discord bot truly optional ([bb8a1f8](http://github.com//cap-md089/capunit-com-v6/commit/bb8a1f8e6a5d5b1156141fc1ac5925711fe94bcd))
* **eventviewer:** eventViewer now shows all events that are linked to the event being viewed ([979dc77](http://github.com//cap-md089/capunit-com-v6/commit/979dc771ed2b4ce4c652536ea589c0c1de64d3ac))
* **flightcontact:** added C/XO and CDC as people who could get flight contact information ([d731f0f](http://github.com//cap-md089/capunit-com-v6/commit/d731f0f03dcf59fc280445281eabae5174fef8e1))
* **new:** continued development on cadet promotion requirements ([67c0a78](http://github.com//cap-md089/capunit-com-v6/commit/67c0a7891e6fca07454c48a0a182054dd45e87e8))
* **prospectivemembers:** added a prospective member management page ([73b07b3](http://github.com//cap-md089/capunit-com-v6/commit/73b07b3b9077ba52e82849a97463225c4a68154d)), closes [#4](http://github.com//cap-md089/capunit-com-v6/issues/4)





# [6.11.0](http://github.com//cap-md089/evmplus-v6/compare/capunit-com-server@6.5.0...capunit-com-server@6.11.0) (2020-09-07)

### Bug Fixes

-   fixed error messages for most PAM apis by updating some functions to use AsyncEither ([1e19f85](http://github.com//cap-md089/evmplus-v6/commit/1e19f852ff73ad2cd0a45feed1df15a228b3a1bb))
-   fixed prospectivemember widget on admin page not being able to load prospective members ([e20ffe6](http://github.com//cap-md089/evmplus-v6/commit/e20ffe60ecd1382f656dfe98837cac7162114bda))
-   fixed user account sign ups ([ebf8821](http://github.com//cap-md089/evmplus-v6/commit/ebf882136c73c1c001ebadacb2945fb543c12854))
-   **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/evmplus-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))

### Features

-   added attendancescanner ([70f9feb](http://github.com//cap-md089/evmplus-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/evmplus-v6/issues/19)
-   added MFA using an OTPA ([900239b](http://github.com//cap-md089/evmplus-v6/commit/900239b673598e22194bd0cb0edbdfef6a3d4cfa))
-   adding cadet promotion requirements display ([6659e57](http://github.com//cap-md089/evmplus-v6/commit/6659e571bcf938370ffb0954c053d24f907d24f4))
-   provided better copy event dialogues ([00901ec](http://github.com//cap-md089/evmplus-v6/commit/00901ec4028c18a5d3cabc990439d493f322b14e)), closes [#13](http://github.com//cap-md089/evmplus-v6/issues/13)
-   **new:** continued development on cadet promotion requirements ([67c0a78](http://github.com//cap-md089/evmplus-v6/commit/67c0a7891e6fca07454c48a0a182054dd45e87e8))

# [6.10.0](http://github.com//cap-md089/evmplus-v6/compare/capunit-com-server@6.5.0...capunit-com-server@6.10.0) (2020-09-07)

### Bug Fixes

-   fixed error messages for most PAM apis by updating some functions to use AsyncEither ([1e19f85](http://github.com//cap-md089/evmplus-v6/commit/1e19f852ff73ad2cd0a45feed1df15a228b3a1bb))
-   **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/evmplus-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))
-   fixed prospectivemember widget on admin page not being able to load prospective members ([e20ffe6](http://github.com//cap-md089/evmplus-v6/commit/e20ffe60ecd1382f656dfe98837cac7162114bda))

### Features

-   added attendancescanner ([70f9feb](http://github.com//cap-md089/evmplus-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/evmplus-v6/issues/19)
-   added MFA using an OTPA ([900239b](http://github.com//cap-md089/evmplus-v6/commit/900239b673598e22194bd0cb0edbdfef6a3d4cfa))
-   adding cadet promotion requirements display ([6659e57](http://github.com//cap-md089/evmplus-v6/commit/6659e571bcf938370ffb0954c053d24f907d24f4))
-   provided better copy event dialogues ([00901ec](http://github.com//cap-md089/evmplus-v6/commit/00901ec4028c18a5d3cabc990439d493f322b14e)), closes [#13](http://github.com//cap-md089/evmplus-v6/issues/13)
-   **new:** continued development on cadet promotion requirements ([67c0a78](http://github.com//cap-md089/evmplus-v6/commit/67c0a7891e6fca07454c48a0a182054dd45e87e8))

# [6.9.0](http://github.com//cap-md089/evmplus-v6/compare/capunit-com-server@6.5.0...capunit-com-server@6.9.0) (2020-09-06)

### Bug Fixes

-   fixed error messages for most PAM apis by updating some functions to use AsyncEither ([1e19f85](http://github.com//cap-md089/evmplus-v6/commit/1e19f852ff73ad2cd0a45feed1df15a228b3a1bb))
-   **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/evmplus-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))
-   fixed prospectivemember widget on admin page not being able to load prospective members ([e20ffe6](http://github.com//cap-md089/evmplus-v6/commit/e20ffe60ecd1382f656dfe98837cac7162114bda))

### Features

-   added attendancescanner ([70f9feb](http://github.com//cap-md089/evmplus-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/evmplus-v6/issues/19)
-   added MFA using an OTPA ([900239b](http://github.com//cap-md089/evmplus-v6/commit/900239b673598e22194bd0cb0edbdfef6a3d4cfa))
-   provided better copy event dialogues ([00901ec](http://github.com//cap-md089/evmplus-v6/commit/00901ec4028c18a5d3cabc990439d493f322b14e)), closes [#13](http://github.com//cap-md089/evmplus-v6/issues/13)

# [6.8.0](http://github.com//cap-md089/evmplus-v6/compare/capunit-com-server@6.5.0...capunit-com-server@6.8.0) (2020-09-02)

### Bug Fixes

-   **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/evmplus-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))
-   fixed prospectivemember widget on admin page not being able to load prospective members ([e20ffe6](http://github.com//cap-md089/evmplus-v6/commit/e20ffe60ecd1382f656dfe98837cac7162114bda))

### Features

-   added attendancescanner ([70f9feb](http://github.com//cap-md089/evmplus-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/evmplus-v6/issues/19)

# [6.7.0](http://github.com//cap-md089/evmplus-v6/compare/capunit-com-server@6.5.0...capunit-com-server@6.7.0) (2020-09-01)

### Bug Fixes

-   **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/evmplus-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))
-   fixed prospectivemember widget on admin page not being able to load prospective members ([e20ffe6](http://github.com//cap-md089/evmplus-v6/commit/e20ffe60ecd1382f656dfe98837cac7162114bda))

### Features

-   added attendancescanner ([70f9feb](http://github.com//cap-md089/evmplus-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/evmplus-v6/issues/19)

# [6.6.0](http://github.com//cap-md089/evmplus-v6/compare/capunit-com-server@6.5.0...capunit-com-server@6.6.0) (2020-08-31)

### Bug Fixes

-   **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/evmplus-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))
-   fixed prospectivemember widget on admin page not being able to load prospective members ([e20ffe6](http://github.com//cap-md089/evmplus-v6/commit/e20ffe60ecd1382f656dfe98837cac7162114bda))

### Features

-   added attendancescanner ([70f9feb](http://github.com//cap-md089/evmplus-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/evmplus-v6/issues/19)

## [6.5.1](http://github.com//cap-md089/evmplus-v6/compare/capunit-com-server@6.5.0...capunit-com-server@6.5.1) (2020-08-25)

**Note:** Version bump only for package capunit-com-server

# [6.5.0](http://github.com//cap-md089/evmplus-v6/compare/capunit-com-server@6.4.0...capunit-com-server@6.5.0) (2020-08-17)

### Bug Fixes

-   **permissions:** fixed client acting like all members had all permissions ([fcc59ea](http://github.com//cap-md089/evmplus-v6/commit/fcc59ea127eb7cec3e0973b7f7797f6e6080483f))
-   exported APIs from server so they can be used by util-cli ([96dbbb4](http://github.com//cap-md089/evmplus-v6/commit/96dbbb41c6f1404142cd01ed40d0406c52154a4f))
-   **discord-bot:** fixed not being able to update flight membership ([6c836ad](http://github.com//cap-md089/evmplus-v6/commit/6c836ad9e0d98ab99d8af5bd855972fdcb644c12))
-   fixed version command on the server ([7388205](http://github.com//cap-md089/evmplus-v6/commit/7388205fd2feb6105e15bbbd43d9cd11dc49c396))

### Features

-   **prospectivemembers:** added a prospective member management page ([73b07b3](http://github.com//cap-md089/evmplus-v6/commit/73b07b3b9077ba52e82849a97463225c4a68154d)), closes [#4](http://github.com//cap-md089/evmplus-v6/issues/4)

## [6.4.1](http://github.com//cap-md089/evmplus-v6/compare/capunit-com-server@6.4.0...capunit-com-server@6.4.1) (2020-08-13)

### Bug Fixes

-   **discord-bot:** fixed not being able to update flight membership ([6c836ad](http://github.com//cap-md089/evmplus-v6/commit/6c836ad9e0d98ab99d8af5bd855972fdcb644c12))
-   fixed version command on the server ([7388205](http://github.com//cap-md089/evmplus-v6/commit/7388205fd2feb6105e15bbbd43d9cd11dc49c396))

# [6.4.0](http://github.com//cap-md089/evmplus-v6/compare/capunit-com-server@6.3.1...capunit-com-server@6.4.0) (2020-08-12)

### Features

-   added version checks ([772beae](http://github.com//cap-md089/evmplus-v6/commit/772beae1ad923db663dfd02c72ddc60f1cc19600))

## [6.3.1](http://github.com//cap-md089/evmplus-v6/compare/capunit-com-server@6.3.0...capunit-com-server@6.3.1) (2020-08-12)

### Bug Fixes

-   **eventviewer:** fixed permissions for event viewer, updated style of client ([10af6a5](http://github.com//cap-md089/evmplus-v6/commit/10af6a5d40800542747943a292419231e4195888))

# 6.3.0 (2020-08-11)

### Bug Fixes

-   updated TypeScript for all packages to 3.9 ([12ee6e6](http://github.com//cap-md089/evmplus-v6/commit/12ee6e67d9669d73d849791cf22637357dd4ae30))
-   **prospectivemembers:** fixed creation of prospective members ([042b39a](http://github.com//cap-md089/evmplus-v6/commit/042b39af12ad8022ec391c0e8562a83d5211f53b))
-   **teamlist:** fixed team managers not being able to see all teams in team list ([20c6da6](http://github.com//cap-md089/evmplus-v6/commit/20c6da60277942133f6ea4e52d6f25b6966ce5a0))
-   **teams:** fixed team edit and discord role updates ([ef2c7a7](http://github.com//cap-md089/evmplus-v6/commit/ef2c7a78ddb3d9b8155218eb9540fbdd820e240c))
-   Fixed link event not showing up ([143df6f](http://github.com//cap-md089/evmplus-v6/commit/143df6f6daaf7975fff3e58c68c888a226d8b31a))

### Features

-   **discord-bot:** made discord bot truly optional ([bb8a1f8](http://github.com//cap-md089/evmplus-v6/commit/bb8a1f8e6a5d5b1156141fc1ac5925711fe94bcd))
-   **eventviewer:** eventViewer now shows all events that are linked to the event being viewed ([979dc77](http://github.com//cap-md089/evmplus-v6/commit/979dc771ed2b4ce4c652536ea589c0c1de64d3ac))
-   **flightcontact:** added C/XO and CDC as people who could get flight contact information ([d731f0f](http://github.com//cap-md089/evmplus-v6/commit/d731f0f03dcf59fc280445281eabae5174fef8e1))

# [6.2.0](http://github.com//cap-md089/evmplus-v6/compare/capunit-com-server@6.1.0...capunit-com-server@6.2.0) (2020-08-11)

### Bug Fixes

-   updated TypeScript for all packages to 3.9 ([12ee6e6](http://github.com//cap-md089/evmplus-v6/commit/12ee6e67d9669d73d849791cf22637357dd4ae30))

### Features

-   **discord-bot:** made discord bot truly optional ([bb8a1f8](http://github.com//cap-md089/evmplus-v6/commit/bb8a1f8e6a5d5b1156141fc1ac5925711fe94bcd))
-   **flightcontact:** added C/XO and CDC as people who could get flight contact information ([d731f0f](http://github.com//cap-md089/evmplus-v6/commit/d731f0f03dcf59fc280445281eabae5174fef8e1))
