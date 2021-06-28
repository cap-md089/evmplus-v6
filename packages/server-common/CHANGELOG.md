# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.25.0](http://github.com//cap-md089/evmplus-v6/compare/server-common@1.16.0...server-common@1.25.0) (2021-06-27)


### Bug Fixes

* fixing the GitHub actions build script ([5d9b174](http://github.com//cap-md089/evmplus-v6/commit/5d9b174ac2e767ad12229c4dd6cf8c2b3a898188))
* **server-common:** added missing implementation for attendance modify check ([2170a41](http://github.com//cap-md089/evmplus-v6/commit/2170a418788ac1bb637c5a0633bb665492387c6c))
* **server-common:** fixed code to match tests ([d2edf8d](http://github.com//cap-md089/evmplus-v6/commit/d2edf8d2e226d5a849c30d8b3b5256a421de6df0))
* ensured that the attendance filters are in place in the server code ([21e1acf](http://github.com//cap-md089/evmplus-v6/commit/21e1acf73f9f88e6402a236643a050ae0a724a1e))
* found that eslint wasn't checking certain files ([25be1cc](http://github.com//cap-md089/evmplus-v6/commit/25be1cc5b028540339a05dc713563b88d226e214))
* removed server-common eslintignore, readded build and lint checks to hook ([4735e17](http://github.com//cap-md089/evmplus-v6/commit/4735e1758d3708f11916c0d1a7d4701658f86779))
* **capwatch import:** fix capwatch cadet hfz import ([e4fba7a](http://github.com//cap-md089/evmplus-v6/commit/e4fba7a5bfc32c69385098e7d67b61dc1e024cf4)), closes [#101](http://github.com//cap-md089/evmplus-v6/issues/101)
* **client-server:** added 'position' field for POC entries in events ([b09d475](http://github.com//cap-md089/evmplus-v6/commit/b09d47510315147e048a0f70c5cdbdcaf9514c09)), closes [#143](http://github.com//cap-md089/evmplus-v6/issues/143)
* **googleutils:** fixed event move not working, added time stamp display to errors ([d4ab35e](http://github.com//cap-md089/evmplus-v6/commit/d4ab35e8d77ad83b4f7d4df6c20c9ef8a3c62476)), closes [#77](http://github.com//cap-md089/evmplus-v6/issues/77)
* **googleutils:** updated googleutils functions to account for deleted Google calendar events ([b2e510e](http://github.com//cap-md089/evmplus-v6/commit/b2e510ecdda3aa49a607bcf37386c472c2f4c9f4))
* **server:** downgraded the MySQL database and driver versions to rollback from bug introduced where ([a3d88cb](http://github.com//cap-md089/evmplus-v6/commit/a3d88cb43d6f189079a25cb0e7c96fa4c91fa31c))
* **server:** fixed compile errors ([fe081aa](http://github.com//cap-md089/evmplus-v6/commit/fe081aa8c11d0d1166b6ed42076f91eb51ae6a5c))
* **server:** fixed spawning 50-100 Discord connections ([137f223](http://github.com//cap-md089/evmplus-v6/commit/137f2230cdcdc19e59ec063ef3e1d35a363d3083))
* **server:** update email wording to change EvMPlus.org to Event Manager ([8cc0aeb](http://github.com//cap-md089/evmplus-v6/commit/8cc0aeb3dd309012632bc73c1e92314c2176d029))
* **server-common:** actually made sendEmail use AWS credentials ([1729107](http://github.com//cap-md089/evmplus-v6/commit/1729107708aa29c631c07482e49afb208c1a5640))
* **server-common:** added proper handling for adding of duplicate attendance records ([5aafb1d](http://github.com//cap-md089/evmplus-v6/commit/5aafb1dc55743b91a8639a299a7e46065ae12ebd))
* **server-common:** fixed full author information being saved in event information ([68d2101](http://github.com//cap-md089/evmplus-v6/commit/68d2101e45d0a2dbf9d39a02543d856f1e6f15eb))
* **server-common:** fixed prospective members being created with the wrong ID ([5835283](http://github.com//cap-md089/evmplus-v6/commit/5835283a149586dcb497be8e293dd4299012fc36))
* **server-common:** fixed types not being included ([567a212](http://github.com//cap-md089/evmplus-v6/commit/567a2120df36cf7bc973759105b8c3bc34b3642e))
* **server-common:** taking more advantage of requests always containing an account backend ([4f1b45b](http://github.com//cap-md089/evmplus-v6/commit/4f1b45b9b36fbeae8409fff98ef0a83dfb1a7886))
* fixed a bug where the file path would show duplicate entries in the drive ([827bcb5](http://github.com//cap-md089/evmplus-v6/commit/827bcb5e08cd7f16a50118de7b2b7d71ec44dcd6))
* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))
* fixed weird configuration bugs ([bc39296](http://github.com//cap-md089/evmplus-v6/commit/bc3929641b0fbc89409f621e3ac0e38b0ab9521e))
* removed unused contact types ([0cf2f68](http://github.com//cap-md089/evmplus-v6/commit/0cf2f68c178d7334f3db10211ec4f372fa3bf8d3))
* **util-cli:** fixed CAPWATCH downloads in Docker ([c535a01](http://github.com//cap-md089/evmplus-v6/commit/c535a011fe23edffde323ccf9d256bfb3b8c2b64))
* updated jest dependencies, fixed jest for client ([b98c96a](http://github.com//cap-md089/evmplus-v6/commit/b98c96a97dac6840308775bad73aec6801391690))


### Features

* **client and server:** added links and display to view event audit information ([16784ec](http://github.com//cap-md089/evmplus-v6/commit/16784ecb2f8b59f905e548a75a0a8a9c1f7695d9))
* **event comments editing and display:** implemented markdown on event editor, display, and rendere ([5355fff](http://github.com//cap-md089/evmplus-v6/commit/5355fff8564a6ddbd26720636f50d7a394ea8a68))
* **EventForm, viewer, linklist:** added indication of which fields are written to Google Calendar, ([b4a1d64](http://github.com//cap-md089/evmplus-v6/commit/b4a1d6466c4ea66af820b6979a62345966ba392e)), closes [#81](http://github.com//cap-md089/evmplus-v6/issues/81) [#80](http://github.com//cap-md089/evmplus-v6/issues/80)
* **import hfz information:** added functionality to import HFZ information file from CAPWATCH ([f5ae56d](http://github.com//cap-md089/evmplus-v6/commit/f5ae56dc7ff97befd2f94c644a08ac9469f0007e))
* **server:** added attendance unit tests ([f1d742f](http://github.com//cap-md089/evmplus-v6/commit/f1d742fdbe27b9776abef1e2a1a98612b9102eac))
* **server client common-lib:** implemented email notification of event sign up ([da85e04](http://github.com//cap-md089/evmplus-v6/commit/da85e041bc841e6ee5eacb777f009197b9359774))
* **server-common:** added more backend use ([2b9b0bb](http://github.com//cap-md089/evmplus-v6/commit/2b9b0bbd8d2efbf4b5e7efb28d6efe3d52b42b18))
* **server-common:** added the ability for the server to recognize new domain names that will be use ([1974a13](http://github.com//cap-md089/evmplus-v6/commit/1974a13e24a4b287e539281634a0610e193051c6))
* **server-common:** updated email title to include maryland wing cap ([80b14e1](http://github.com//cap-md089/evmplus-v6/commit/80b14e1f96339cd2d9443f6daaaedbdec0659254))
* **server-jest-config:** added extra data functions to help with generating server side tests ([f9ed16d](http://github.com//cap-md089/evmplus-v6/commit/f9ed16d8b1ca7a9f95c0a2fcac4d9197f59eb380))
* added the ability to generate preset data for tests ([4ae8a29](http://github.com//cap-md089/evmplus-v6/commit/4ae8a29f972f120ee62f8217ca956edde80ef1af))
* **server-common:** adding more backends and more things using backends ([ea37ec5](http://github.com//cap-md089/evmplus-v6/commit/ea37ec591b8bc770703eb949103dc4ef3688e721))
* added the ability to modify linked events ([c219817](http://github.com//cap-md089/evmplus-v6/commit/c219817c51c189f84ce04876be2b56ecd1dcd2a0))
* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))
* added the events and personalfolders folders ([82f5b48](http://github.com//cap-md089/evmplus-v6/commit/82f5b48feba7638046532ea225cd7ccdb2165b85))


### Performance Improvements

* **client:** added context API to allow for caching of downloading member and team lists ([99a9651](http://github.com//cap-md089/evmplus-v6/commit/99a9651404379dc1797ed747b925901449297123))
* **server:** moved the built client files from the node process to the nginx process ([00ddefb](http://github.com//cap-md089/evmplus-v6/commit/00ddefb01ae85b2ba78e042dc4899e48d2a5d282))
* **server-common:** removed an N+1 query for the querying of the members from an account ([7b54560](http://github.com//cap-md089/evmplus-v6/commit/7b54560ede9f2dd8ec580e6d43855588e8c32ef1))





# [1.24.0](http://github.com//cap-md089/evmplus-v6/compare/server-common@1.16.0...server-common@1.24.0) (2021-03-15)


### Bug Fixes

* **client-server:** added 'position' field for POC entries in events ([b09d475](http://github.com//cap-md089/evmplus-v6/commit/b09d47510315147e048a0f70c5cdbdcaf9514c09)), closes [#143](http://github.com//cap-md089/evmplus-v6/issues/143)
* **server:** fixed spawning 50-100 Discord connections ([137f223](http://github.com//cap-md089/evmplus-v6/commit/137f2230cdcdc19e59ec063ef3e1d35a363d3083))
* **server:** update email wording to change EvMPlus.org to Event Manager ([8cc0aeb](http://github.com//cap-md089/evmplus-v6/commit/8cc0aeb3dd309012632bc73c1e92314c2176d029))
* **server-common:** actually made sendEmail use AWS credentials ([1729107](http://github.com//cap-md089/evmplus-v6/commit/1729107708aa29c631c07482e49afb208c1a5640))
* fixed a bug where the file path would show duplicate entries in the drive ([827bcb5](http://github.com//cap-md089/evmplus-v6/commit/827bcb5e08cd7f16a50118de7b2b7d71ec44dcd6))
* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))
* fixed weird configuration bugs ([bc39296](http://github.com//cap-md089/evmplus-v6/commit/bc3929641b0fbc89409f621e3ac0e38b0ab9521e))
* removed unused contact types ([0cf2f68](http://github.com//cap-md089/evmplus-v6/commit/0cf2f68c178d7334f3db10211ec4f372fa3bf8d3))
* **capwatch import:** fix capwatch cadet hfz import ([e4fba7a](http://github.com//cap-md089/evmplus-v6/commit/e4fba7a5bfc32c69385098e7d67b61dc1e024cf4)), closes [#101](http://github.com//cap-md089/evmplus-v6/issues/101)
* **googleutils:** fixed event move not working, added time stamp display to errors ([d4ab35e](http://github.com//cap-md089/evmplus-v6/commit/d4ab35e8d77ad83b4f7d4df6c20c9ef8a3c62476)), closes [#77](http://github.com//cap-md089/evmplus-v6/issues/77)
* **googleutils:** updated googleutils functions to account for deleted Google calendar events ([b2e510e](http://github.com//cap-md089/evmplus-v6/commit/b2e510ecdda3aa49a607bcf37386c472c2f4c9f4))
* **server-common:** fixed prospective members being created with the wrong ID ([5835283](http://github.com//cap-md089/evmplus-v6/commit/5835283a149586dcb497be8e293dd4299012fc36))
* **util-cli:** fixed CAPWATCH downloads in Docker ([c535a01](http://github.com//cap-md089/evmplus-v6/commit/c535a011fe23edffde323ccf9d256bfb3b8c2b64))
* updated jest dependencies, fixed jest for client ([b98c96a](http://github.com//cap-md089/evmplus-v6/commit/b98c96a97dac6840308775bad73aec6801391690))


### Features

* **client and server:** added links and display to view event audit information ([16784ec](http://github.com//cap-md089/evmplus-v6/commit/16784ecb2f8b59f905e548a75a0a8a9c1f7695d9))
* **event comments editing and display:** implemented markdown on event editor, display, and rendere ([5355fff](http://github.com//cap-md089/evmplus-v6/commit/5355fff8564a6ddbd26720636f50d7a394ea8a68))
* **EventForm, viewer, linklist:** added indication of which fields are written to Google Calendar, ([b4a1d64](http://github.com//cap-md089/evmplus-v6/commit/b4a1d6466c4ea66af820b6979a62345966ba392e)), closes [#81](http://github.com//cap-md089/evmplus-v6/issues/81) [#80](http://github.com//cap-md089/evmplus-v6/issues/80)
* **import hfz information:** added functionality to import HFZ information file from CAPWATCH ([f5ae56d](http://github.com//cap-md089/evmplus-v6/commit/f5ae56dc7ff97befd2f94c644a08ac9469f0007e))
* **server-common:** added the ability for the server to recognize new domain names that will be use ([1974a13](http://github.com//cap-md089/evmplus-v6/commit/1974a13e24a4b287e539281634a0610e193051c6))
* **server-common:** updated email title to include maryland wing cap ([80b14e1](http://github.com//cap-md089/evmplus-v6/commit/80b14e1f96339cd2d9443f6daaaedbdec0659254))
* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))
* added the events and personalfolders folders ([82f5b48](http://github.com//cap-md089/evmplus-v6/commit/82f5b48feba7638046532ea225cd7ccdb2165b85))


### Performance Improvements

* **client:** added context API to allow for caching of downloading member and team lists ([99a9651](http://github.com//cap-md089/evmplus-v6/commit/99a9651404379dc1797ed747b925901449297123))
* **server:** moved the built client files from the node process to the nginx process ([00ddefb](http://github.com//cap-md089/evmplus-v6/commit/00ddefb01ae85b2ba78e042dc4899e48d2a5d282))
* **server-common:** removed an N+1 query for the querying of the members from an account ([7b54560](http://github.com//cap-md089/evmplus-v6/commit/7b54560ede9f2dd8ec580e6d43855588e8c32ef1))





# [1.23.0](http://github.com//cap-md089/evmplus-v6/compare/server-common@1.16.0...server-common@1.23.0) (2020-12-09)


### Bug Fixes

* **server-common:** fixed saveExtraMemberInformation not adding information to database when appropr ([cc70767](http://github.com//cap-md089/evmplus-v6/commit/cc7076770ced08b9a115ede1b216f4716ec625af))
* event organizers can now add anyone to attendance so long as they aren't already in attendance; ([416b227](http://github.com//cap-md089/evmplus-v6/commit/416b227d1d6748977c9b7a823c87cf8c79f0f32e))
* **capwatch import:** fix capwatch cadet hfz import ([e4fba7a](http://github.com//cap-md089/evmplus-v6/commit/e4fba7a5bfc32c69385098e7d67b61dc1e024cf4)), closes [#101](http://github.com//cap-md089/evmplus-v6/issues/101)
* **server:** fixed headers not being properly handled ([d0829e9](http://github.com//cap-md089/evmplus-v6/commit/d0829e9c94399c402388c26ec05512e53153615b))
* fixed trySignin throwing an error on a username not being found ([cb4240f](http://github.com//cap-md089/evmplus-v6/commit/cb4240f32371fabfccd019c21bdcda1c48d01b02))
* **googleutils:** fixed event move not working, added time stamp display to errors ([d4ab35e](http://github.com//cap-md089/evmplus-v6/commit/d4ab35e8d77ad83b4f7d4df6c20c9ef8a3c62476)), closes [#77](http://github.com//cap-md089/evmplus-v6/issues/77)
* **googleutils:** updated googleutils functions to account for deleted Google calendar events ([b2e510e](http://github.com//cap-md089/evmplus-v6/commit/b2e510ecdda3aa49a607bcf37386c472c2f4c9f4))
* **server:** fixed requests with no authorization token crashing the server ([8712dd3](http://github.com//cap-md089/evmplus-v6/commit/8712dd3de8c058e9c8e3612d239e37cee331f1f8))
* **server-common:** fixed prospective members being created with the wrong ID ([5835283](http://github.com//cap-md089/evmplus-v6/commit/5835283a149586dcb497be8e293dd4299012fc36))
* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))
* updated jest dependencies, fixed jest for client ([b98c96a](http://github.com//cap-md089/evmplus-v6/commit/b98c96a97dac6840308775bad73aec6801391690))


### Features

* **event comments editing and display:** implemented markdown on event editor, display, and rendere ([5355fff](http://github.com//cap-md089/evmplus-v6/commit/5355fff8564a6ddbd26720636f50d7a394ea8a68))
* **EventForm, viewer, linklist:** added indication of which fields are written to Google Calendar, ([b4a1d64](http://github.com//cap-md089/evmplus-v6/commit/b4a1d6466c4ea66af820b6979a62345966ba392e)), closes [#81](http://github.com//cap-md089/evmplus-v6/issues/81) [#80](http://github.com//cap-md089/evmplus-v6/issues/80)
* **import hfz information:** added functionality to import HFZ information file from CAPWATCH ([f5ae56d](http://github.com//cap-md089/evmplus-v6/commit/f5ae56dc7ff97befd2f94c644a08ac9469f0007e))
* **server:** changed logging for production ([176c3dd](http://github.com//cap-md089/evmplus-v6/commit/176c3dd134cf0255c0bf845e7acb25c5d2ec85d2))
* **server-common:** added extra configuration for different drive locations ([fa8d141](http://github.com//cap-md089/evmplus-v6/commit/fa8d141580c801766af94f405c5e285085c5a885))
* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# [1.22.0](http://github.com//cap-md089/evmplus-v6/compare/server-common@1.16.0...server-common@1.22.0) (2020-10-30)


### Bug Fixes

* **server-common:** fixed prospective members being created with the wrong ID ([5835283](http://github.com//cap-md089/evmplus-v6/commit/5835283a149586dcb497be8e293dd4299012fc36))
* updated jest dependencies, fixed jest for client ([b98c96a](http://github.com//cap-md089/evmplus-v6/commit/b98c96a97dac6840308775bad73aec6801391690))
* **googleutils:** fixed event move not working, added time stamp display to errors ([d4ab35e](http://github.com//cap-md089/evmplus-v6/commit/d4ab35e8d77ad83b4f7d4df6c20c9ef8a3c62476)), closes [#77](http://github.com//cap-md089/evmplus-v6/issues/77)
* **googleutils:** updated googleutils functions to account for deleted Google calendar events ([b2e510e](http://github.com//cap-md089/evmplus-v6/commit/b2e510ecdda3aa49a607bcf37386c472c2f4c9f4))
* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))


### Features

* **event comments editing and display:** implemented markdown on event editor, display, and rendere ([5355fff](http://github.com//cap-md089/evmplus-v6/commit/5355fff8564a6ddbd26720636f50d7a394ea8a68))
* **EventForm, viewer, linklist:** added indication of which fields are written to Google Calendar, ([b4a1d64](http://github.com//cap-md089/evmplus-v6/commit/b4a1d6466c4ea66af820b6979a62345966ba392e)), closes [#81](http://github.com//cap-md089/evmplus-v6/issues/81) [#80](http://github.com//cap-md089/evmplus-v6/issues/80)
* **import hfz information:** added functionality to import HFZ information file from CAPWATCH ([f5ae56d](http://github.com//cap-md089/evmplus-v6/commit/f5ae56dc7ff97befd2f94c644a08ac9469f0007e))
* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# [1.21.0](http://github.com//cap-md089/evmplus-v6/compare/server-common@1.16.0...server-common@1.21.0) (2020-10-29)


### Bug Fixes

* **server-common:** fixed prospective members being created with the wrong ID ([5835283](http://github.com//cap-md089/evmplus-v6/commit/5835283a149586dcb497be8e293dd4299012fc36))
* updated jest dependencies, fixed jest for client ([b98c96a](http://github.com//cap-md089/evmplus-v6/commit/b98c96a97dac6840308775bad73aec6801391690))
* **googleutils:** fixed event move not working, added time stamp display to errors ([d4ab35e](http://github.com//cap-md089/evmplus-v6/commit/d4ab35e8d77ad83b4f7d4df6c20c9ef8a3c62476)), closes [#77](http://github.com//cap-md089/evmplus-v6/issues/77)
* **googleutils:** updated googleutils functions to account for deleted Google calendar events ([b2e510e](http://github.com//cap-md089/evmplus-v6/commit/b2e510ecdda3aa49a607bcf37386c472c2f4c9f4))
* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))


### Features

* **event comments editing and display:** implemented markdown on event editor, display, and rendere ([5355fff](http://github.com//cap-md089/evmplus-v6/commit/5355fff8564a6ddbd26720636f50d7a394ea8a68))
* **EventForm, viewer, linklist:** added indication of which fields are written to Google Calendar, ([b4a1d64](http://github.com//cap-md089/evmplus-v6/commit/b4a1d6466c4ea66af820b6979a62345966ba392e)), closes [#81](http://github.com//cap-md089/evmplus-v6/issues/81) [#80](http://github.com//cap-md089/evmplus-v6/issues/80)
* **import hfz information:** added functionality to import HFZ information file from CAPWATCH ([f5ae56d](http://github.com//cap-md089/evmplus-v6/commit/f5ae56dc7ff97befd2f94c644a08ac9469f0007e))
* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# [1.20.0](http://github.com//cap-md089/evmplus-v6/compare/server-common@1.16.0...server-common@1.20.0) (2020-10-27)


### Bug Fixes

* updated jest dependencies, fixed jest for client ([b98c96a](http://github.com//cap-md089/evmplus-v6/commit/b98c96a97dac6840308775bad73aec6801391690))
* **googleutils:** fixed event move not working, added time stamp display to errors ([d4ab35e](http://github.com//cap-md089/evmplus-v6/commit/d4ab35e8d77ad83b4f7d4df6c20c9ef8a3c62476)), closes [#77](http://github.com//cap-md089/evmplus-v6/issues/77)
* **googleutils:** updated googleutils functions to account for deleted Google calendar events ([b2e510e](http://github.com//cap-md089/evmplus-v6/commit/b2e510ecdda3aa49a607bcf37386c472c2f4c9f4))
* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))


### Features

* **event comments editing and display:** implemented markdown on event editor, display, and rendere ([5355fff](http://github.com//cap-md089/evmplus-v6/commit/5355fff8564a6ddbd26720636f50d7a394ea8a68))
* **EventForm, viewer, linklist:** added indication of which fields are written to Google Calendar, ([b4a1d64](http://github.com//cap-md089/evmplus-v6/commit/b4a1d6466c4ea66af820b6979a62345966ba392e)), closes [#81](http://github.com//cap-md089/evmplus-v6/issues/81) [#80](http://github.com//cap-md089/evmplus-v6/issues/80)
* **import hfz information:** added functionality to import HFZ information file from CAPWATCH ([f5ae56d](http://github.com//cap-md089/evmplus-v6/commit/f5ae56dc7ff97befd2f94c644a08ac9469f0007e))
* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# [1.19.0](http://github.com//cap-md089/evmplus-v6/compare/server-common@1.16.0...server-common@1.19.0) (2020-10-16)


### Bug Fixes

* fixed creation of prospective members ([6011736](http://github.com//cap-md089/evmplus-v6/commit/60117367e3c33c9bf37a523f5525e09740034b04))
* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))
* fixed linked events not being fully updated when the parent event is modified ([55806cc](http://github.com//cap-md089/evmplus-v6/commit/55806cc12e5a0f75152434c22d4377add79019a1))
* **googleutils:** fixed event move not working, added time stamp display to errors ([d4ab35e](http://github.com//cap-md089/evmplus-v6/commit/d4ab35e8d77ad83b4f7d4df6c20c9ef8a3c62476)), closes [#77](http://github.com//cap-md089/evmplus-v6/issues/77)


### Features

* **event comments editing and display:** implemented markdown on event editor, display, and rendere ([5355fff](http://github.com//cap-md089/evmplus-v6/commit/5355fff8564a6ddbd26720636f50d7a394ea8a68))
* **EventForm, viewer, linklist:** added indication of which fields are written to Google Calendar, ([b4a1d64](http://github.com//cap-md089/evmplus-v6/commit/b4a1d6466c4ea66af820b6979a62345966ba392e)), closes [#81](http://github.com//cap-md089/evmplus-v6/issues/81) [#80](http://github.com//cap-md089/evmplus-v6/issues/80)
* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# [1.18.0](http://github.com//cap-md089/evmplus-v6/compare/server-common@1.16.0...server-common@1.18.0) (2020-10-08)


### Bug Fixes

* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))


### Features

* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# [1.17.0](http://github.com//cap-md089/evmplus-v6/compare/server-common@1.16.0...server-common@1.17.0) (2020-10-06)


### Bug Fixes

* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))


### Features

* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# [1.16.0](http://github.com//cap-md089/evmplus-v6/compare/server-common@1.4.0...server-common@1.16.0) (2020-09-29)


### Bug Fixes

* **googleutils:** fixed GoogleUtils error out when directed to delete a Google event ([991824b](http://github.com//cap-md089/evmplus-v6/commit/991824b91e6f64881b527efbc786c451af26b2f9)), closes [#41](http://github.com//cap-md089/evmplus-v6/issues/41)
* fixed error messages for most PAM apis by updating some functions to use AsyncEither ([1e19f85](http://github.com//cap-md089/evmplus-v6/commit/1e19f852ff73ad2cd0a45feed1df15a228b3a1bb))
* fixed google calendar update tripping up on modifying registration and wing events ([03d87ee](http://github.com//cap-md089/evmplus-v6/commit/03d87ee8113bf748869e66ce2ddf76a324695913)), closes [#9](http://github.com//cap-md089/evmplus-v6/issues/9)
* fixed ImportCAPWATCHFile types to more accurately reflect the types of a CAPWATCH CSV file ([fffae38](http://github.com//cap-md089/evmplus-v6/commit/fffae38d6ba729c7592b1567242e4ea97cfe185e))
* fixed linking events and attendance management ([78cb150](http://github.com//cap-md089/evmplus-v6/commit/78cb150039463240ef89b493d842d185c3b3d36a))
* fixed not being able to sign up for an account ([7f9938b](http://github.com//cap-md089/evmplus-v6/commit/7f9938be4aa41802f1c9ae9dddf613a1e727c1e6)), closes [#30](http://github.com//cap-md089/evmplus-v6/issues/30)
* fixed time representation in Google calendar item description blocks ([c70773b](http://github.com//cap-md089/evmplus-v6/commit/c70773b5233aeba39d0656ae6d4eb87b423a5093)), closes [#44](http://github.com//cap-md089/evmplus-v6/issues/44)
* fixed trying to update Google calendar items for draft events ([bb3b8ff](http://github.com//cap-md089/evmplus-v6/commit/bb3b8ff755c4e847b35e9f806a200a6f1c716d1a)), closes [#42](http://github.com//cap-md089/evmplus-v6/issues/42)
* fixed user account sign ups ([ebf8821](http://github.com//cap-md089/evmplus-v6/commit/ebf882136c73c1c001ebadacb2945fb543c12854))
* removed Wing calendar ([b7f6d84](http://github.com//cap-md089/evmplus-v6/commit/b7f6d84f1a9f203297111d9d2386ee5569434894)), closes [#24](http://github.com//cap-md089/evmplus-v6/issues/24)
* **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/evmplus-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))


### Features

* **event form and viewer:** multiple event field updates ([81c1840](http://github.com//cap-md089/evmplus-v6/commit/81c184029a600c8057bfe943006bfcec82ef3389)), closes [#47](http://github.com//cap-md089/evmplus-v6/issues/47) [#46](http://github.com//cap-md089/evmplus-v6/issues/46) [#35](http://github.com//cap-md089/evmplus-v6/issues/35)
* **signin:** added sign in logging ([c48fd90](http://github.com//cap-md089/evmplus-v6/commit/c48fd904a5b6c3f6a118ff74ebca88dc726dae41)), closes [#26](http://github.com//cap-md089/evmplus-v6/issues/26)
* added attendancescanner ([70f9feb](http://github.com//cap-md089/evmplus-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/evmplus-v6/issues/19)
* added MFA using an OTPA ([900239b](http://github.com//cap-md089/evmplus-v6/commit/900239b673598e22194bd0cb0edbdfef6a3d4cfa))
* adding cadet promotion requirements display ([6659e57](http://github.com//cap-md089/evmplus-v6/commit/6659e571bcf938370ffb0954c053d24f907d24f4))
* made PAM.RequireMemberType smarter ([fbbc6ed](http://github.com//cap-md089/evmplus-v6/commit/fbbc6eda975457e8fcee52c33d227c31e6ce5c7b))
* provided better copy event dialogues ([00901ec](http://github.com//cap-md089/evmplus-v6/commit/00901ec4028c18a5d3cabc990439d493f322b14e)), closes [#13](http://github.com//cap-md089/evmplus-v6/issues/13)
* updated Discord CLI to allow for bot to update servers after CAPWATCH updates ([bc4125f](http://github.com//cap-md089/evmplus-v6/commit/bc4125f054df6ee7a77ada7bd73301305ec11d94))
* **new:** continued development on cadet promotion requirements ([67c0a78](http://github.com//cap-md089/evmplus-v6/commit/67c0a7891e6fca07454c48a0a182054dd45e87e8))





# [1.15.0](http://github.com//cap-md089/evmplus-v6/compare/server-common@1.4.0...server-common@1.15.0) (2020-09-28)


### Bug Fixes

* **googleutils:** fixed GoogleUtils error out when directed to delete a Google event ([991824b](http://github.com//cap-md089/evmplus-v6/commit/991824b91e6f64881b527efbc786c451af26b2f9)), closes [#41](http://github.com//cap-md089/evmplus-v6/issues/41)
* fixed error messages for most PAM apis by updating some functions to use AsyncEither ([1e19f85](http://github.com//cap-md089/evmplus-v6/commit/1e19f852ff73ad2cd0a45feed1df15a228b3a1bb))
* fixed google calendar update tripping up on modifying registration and wing events ([03d87ee](http://github.com//cap-md089/evmplus-v6/commit/03d87ee8113bf748869e66ce2ddf76a324695913)), closes [#9](http://github.com//cap-md089/evmplus-v6/issues/9)
* fixed ImportCAPWATCHFile types to more accurately reflect the types of a CAPWATCH CSV file ([fffae38](http://github.com//cap-md089/evmplus-v6/commit/fffae38d6ba729c7592b1567242e4ea97cfe185e))
* fixed linking events and attendance management ([78cb150](http://github.com//cap-md089/evmplus-v6/commit/78cb150039463240ef89b493d842d185c3b3d36a))
* fixed not being able to sign up for an account ([7f9938b](http://github.com//cap-md089/evmplus-v6/commit/7f9938be4aa41802f1c9ae9dddf613a1e727c1e6)), closes [#30](http://github.com//cap-md089/evmplus-v6/issues/30)
* fixed time representation in Google calendar item description blocks ([c70773b](http://github.com//cap-md089/evmplus-v6/commit/c70773b5233aeba39d0656ae6d4eb87b423a5093)), closes [#44](http://github.com//cap-md089/evmplus-v6/issues/44)
* fixed trying to update Google calendar items for draft events ([bb3b8ff](http://github.com//cap-md089/evmplus-v6/commit/bb3b8ff755c4e847b35e9f806a200a6f1c716d1a)), closes [#42](http://github.com//cap-md089/evmplus-v6/issues/42)
* fixed user account sign ups ([ebf8821](http://github.com//cap-md089/evmplus-v6/commit/ebf882136c73c1c001ebadacb2945fb543c12854))
* removed Wing calendar ([b7f6d84](http://github.com//cap-md089/evmplus-v6/commit/b7f6d84f1a9f203297111d9d2386ee5569434894)), closes [#24](http://github.com//cap-md089/evmplus-v6/issues/24)
* **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/evmplus-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))


### Features

* **signin:** added sign in logging ([c48fd90](http://github.com//cap-md089/evmplus-v6/commit/c48fd904a5b6c3f6a118ff74ebca88dc726dae41)), closes [#26](http://github.com//cap-md089/evmplus-v6/issues/26)
* added attendancescanner ([70f9feb](http://github.com//cap-md089/evmplus-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/evmplus-v6/issues/19)
* added MFA using an OTPA ([900239b](http://github.com//cap-md089/evmplus-v6/commit/900239b673598e22194bd0cb0edbdfef6a3d4cfa))
* adding cadet promotion requirements display ([6659e57](http://github.com//cap-md089/evmplus-v6/commit/6659e571bcf938370ffb0954c053d24f907d24f4))
* made PAM.RequireMemberType smarter ([fbbc6ed](http://github.com//cap-md089/evmplus-v6/commit/fbbc6eda975457e8fcee52c33d227c31e6ce5c7b))
* provided better copy event dialogues ([00901ec](http://github.com//cap-md089/evmplus-v6/commit/00901ec4028c18a5d3cabc990439d493f322b14e)), closes [#13](http://github.com//cap-md089/evmplus-v6/issues/13)
* updated Discord CLI to allow for bot to update servers after CAPWATCH updates ([bc4125f](http://github.com//cap-md089/evmplus-v6/commit/bc4125f054df6ee7a77ada7bd73301305ec11d94))
* **new:** continued development on cadet promotion requirements ([67c0a78](http://github.com//cap-md089/evmplus-v6/commit/67c0a7891e6fca07454c48a0a182054dd45e87e8))





# [1.14.0](http://github.com//cap-md089/evmplus-v6/compare/server-common@1.4.0...server-common@1.14.0) (2020-09-27)


### Bug Fixes

* fixed error messages for most PAM apis by updating some functions to use AsyncEither ([1e19f85](http://github.com//cap-md089/evmplus-v6/commit/1e19f852ff73ad2cd0a45feed1df15a228b3a1bb))
* fixed google calendar update tripping up on modifying registration and wing events ([03d87ee](http://github.com//cap-md089/evmplus-v6/commit/03d87ee8113bf748869e66ce2ddf76a324695913)), closes [#9](http://github.com//cap-md089/evmplus-v6/issues/9)
* fixed ImportCAPWATCHFile types to more accurately reflect the types of a CAPWATCH CSV file ([fffae38](http://github.com//cap-md089/evmplus-v6/commit/fffae38d6ba729c7592b1567242e4ea97cfe185e))
* fixed linking events and attendance management ([78cb150](http://github.com//cap-md089/evmplus-v6/commit/78cb150039463240ef89b493d842d185c3b3d36a))
* fixed not being able to sign up for an account ([7f9938b](http://github.com//cap-md089/evmplus-v6/commit/7f9938be4aa41802f1c9ae9dddf613a1e727c1e6)), closes [#30](http://github.com//cap-md089/evmplus-v6/issues/30)
* fixed time representation in Google calendar item description blocks ([c70773b](http://github.com//cap-md089/evmplus-v6/commit/c70773b5233aeba39d0656ae6d4eb87b423a5093)), closes [#44](http://github.com//cap-md089/evmplus-v6/issues/44)
* fixed trying to update Google calendar items for draft events ([bb3b8ff](http://github.com//cap-md089/evmplus-v6/commit/bb3b8ff755c4e847b35e9f806a200a6f1c716d1a)), closes [#42](http://github.com//cap-md089/evmplus-v6/issues/42)
* fixed user account sign ups ([ebf8821](http://github.com//cap-md089/evmplus-v6/commit/ebf882136c73c1c001ebadacb2945fb543c12854))
* removed Wing calendar ([b7f6d84](http://github.com//cap-md089/evmplus-v6/commit/b7f6d84f1a9f203297111d9d2386ee5569434894)), closes [#24](http://github.com//cap-md089/evmplus-v6/issues/24)
* **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/evmplus-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))


### Features

* **signin:** added sign in logging ([c48fd90](http://github.com//cap-md089/evmplus-v6/commit/c48fd904a5b6c3f6a118ff74ebca88dc726dae41)), closes [#26](http://github.com//cap-md089/evmplus-v6/issues/26)
* added attendancescanner ([70f9feb](http://github.com//cap-md089/evmplus-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/evmplus-v6/issues/19)
* added MFA using an OTPA ([900239b](http://github.com//cap-md089/evmplus-v6/commit/900239b673598e22194bd0cb0edbdfef6a3d4cfa))
* adding cadet promotion requirements display ([6659e57](http://github.com//cap-md089/evmplus-v6/commit/6659e571bcf938370ffb0954c053d24f907d24f4))
* made PAM.RequireMemberType smarter ([fbbc6ed](http://github.com//cap-md089/evmplus-v6/commit/fbbc6eda975457e8fcee52c33d227c31e6ce5c7b))
* provided better copy event dialogues ([00901ec](http://github.com//cap-md089/evmplus-v6/commit/00901ec4028c18a5d3cabc990439d493f322b14e)), closes [#13](http://github.com//cap-md089/evmplus-v6/issues/13)
* updated Discord CLI to allow for bot to update servers after CAPWATCH updates ([bc4125f](http://github.com//cap-md089/evmplus-v6/commit/bc4125f054df6ee7a77ada7bd73301305ec11d94))
* **new:** continued development on cadet promotion requirements ([67c0a78](http://github.com//cap-md089/evmplus-v6/commit/67c0a7891e6fca07454c48a0a182054dd45e87e8))





# [1.13.0](http://github.com//cap-md089/evmplus-v6/compare/server-common@1.4.0...server-common@1.13.0) (2020-09-24)


### Bug Fixes

* fixed error messages for most PAM apis by updating some functions to use AsyncEither ([1e19f85](http://github.com//cap-md089/evmplus-v6/commit/1e19f852ff73ad2cd0a45feed1df15a228b3a1bb))
* fixed google calendar update tripping up on modifying registration and wing events ([03d87ee](http://github.com//cap-md089/evmplus-v6/commit/03d87ee8113bf748869e66ce2ddf76a324695913)), closes [#9](http://github.com//cap-md089/evmplus-v6/issues/9)
* fixed ImportCAPWATCHFile types to more accurately reflect the types of a CAPWATCH CSV file ([fffae38](http://github.com//cap-md089/evmplus-v6/commit/fffae38d6ba729c7592b1567242e4ea97cfe185e))
* fixed linking events and attendance management ([78cb150](http://github.com//cap-md089/evmplus-v6/commit/78cb150039463240ef89b493d842d185c3b3d36a))
* fixed not being able to sign up for an account ([7f9938b](http://github.com//cap-md089/evmplus-v6/commit/7f9938be4aa41802f1c9ae9dddf613a1e727c1e6)), closes [#30](http://github.com//cap-md089/evmplus-v6/issues/30)
* fixed time representation in Google calendar item description blocks ([c70773b](http://github.com//cap-md089/evmplus-v6/commit/c70773b5233aeba39d0656ae6d4eb87b423a5093)), closes [#44](http://github.com//cap-md089/evmplus-v6/issues/44)
* fixed trying to update Google calendar items for draft events ([bb3b8ff](http://github.com//cap-md089/evmplus-v6/commit/bb3b8ff755c4e847b35e9f806a200a6f1c716d1a)), closes [#42](http://github.com//cap-md089/evmplus-v6/issues/42)
* fixed user account sign ups ([ebf8821](http://github.com//cap-md089/evmplus-v6/commit/ebf882136c73c1c001ebadacb2945fb543c12854))
* removed Wing calendar ([b7f6d84](http://github.com//cap-md089/evmplus-v6/commit/b7f6d84f1a9f203297111d9d2386ee5569434894)), closes [#24](http://github.com//cap-md089/evmplus-v6/issues/24)
* **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/evmplus-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))


### Features

* **signin:** added sign in logging ([c48fd90](http://github.com//cap-md089/evmplus-v6/commit/c48fd904a5b6c3f6a118ff74ebca88dc726dae41)), closes [#26](http://github.com//cap-md089/evmplus-v6/issues/26)
* added attendancescanner ([70f9feb](http://github.com//cap-md089/evmplus-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/evmplus-v6/issues/19)
* added MFA using an OTPA ([900239b](http://github.com//cap-md089/evmplus-v6/commit/900239b673598e22194bd0cb0edbdfef6a3d4cfa))
* adding cadet promotion requirements display ([6659e57](http://github.com//cap-md089/evmplus-v6/commit/6659e571bcf938370ffb0954c053d24f907d24f4))
* made PAM.RequireMemberType smarter ([fbbc6ed](http://github.com//cap-md089/evmplus-v6/commit/fbbc6eda975457e8fcee52c33d227c31e6ce5c7b))
* provided better copy event dialogues ([00901ec](http://github.com//cap-md089/evmplus-v6/commit/00901ec4028c18a5d3cabc990439d493f322b14e)), closes [#13](http://github.com//cap-md089/evmplus-v6/issues/13)
* updated Discord CLI to allow for bot to update servers after CAPWATCH updates ([bc4125f](http://github.com//cap-md089/evmplus-v6/commit/bc4125f054df6ee7a77ada7bd73301305ec11d94))
* **new:** continued development on cadet promotion requirements ([67c0a78](http://github.com//cap-md089/evmplus-v6/commit/67c0a7891e6fca07454c48a0a182054dd45e87e8))





# [1.12.0](http://github.com//cap-md089/capunit-com-v6/compare/server-common@1.4.0...server-common@1.12.0) (2020-09-09)


### Bug Fixes

* fixed error messages for most PAM apis by updating some functions to use AsyncEither ([1e19f85](http://github.com//cap-md089/capunit-com-v6/commit/1e19f852ff73ad2cd0a45feed1df15a228b3a1bb))
* fixed google calendar update tripping up on modifying registration and wing events ([03d87ee](http://github.com//cap-md089/capunit-com-v6/commit/03d87ee8113bf748869e66ce2ddf76a324695913)), closes [#9](http://github.com//cap-md089/capunit-com-v6/issues/9)
* fixed ImportCAPWATCHFile types to more accurately reflect the types of a CAPWATCH CSV file ([fffae38](http://github.com//cap-md089/capunit-com-v6/commit/fffae38d6ba729c7592b1567242e4ea97cfe185e))
* fixed not being able to sign up for an account ([7f9938b](http://github.com//cap-md089/capunit-com-v6/commit/7f9938be4aa41802f1c9ae9dddf613a1e727c1e6)), closes [#30](http://github.com//cap-md089/capunit-com-v6/issues/30)
* fixed user account sign ups ([ebf8821](http://github.com//cap-md089/capunit-com-v6/commit/ebf882136c73c1c001ebadacb2945fb543c12854))
* removed Wing calendar ([b7f6d84](http://github.com//cap-md089/capunit-com-v6/commit/b7f6d84f1a9f203297111d9d2386ee5569434894)), closes [#24](http://github.com//cap-md089/capunit-com-v6/issues/24)
* **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/capunit-com-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))


### Features

* added attendancescanner ([70f9feb](http://github.com//cap-md089/capunit-com-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/capunit-com-v6/issues/19)
* added MFA using an OTPA ([900239b](http://github.com//cap-md089/capunit-com-v6/commit/900239b673598e22194bd0cb0edbdfef6a3d4cfa))
* adding cadet promotion requirements display ([6659e57](http://github.com//cap-md089/capunit-com-v6/commit/6659e571bcf938370ffb0954c053d24f907d24f4))
* provided better copy event dialogues ([00901ec](http://github.com//cap-md089/capunit-com-v6/commit/00901ec4028c18a5d3cabc990439d493f322b14e)), closes [#13](http://github.com//cap-md089/capunit-com-v6/issues/13)
* **new:** continued development on cadet promotion requirements ([67c0a78](http://github.com//cap-md089/capunit-com-v6/commit/67c0a7891e6fca07454c48a0a182054dd45e87e8))
* made PAM.RequireMemberType smarter ([fbbc6ed](http://github.com//cap-md089/capunit-com-v6/commit/fbbc6eda975457e8fcee52c33d227c31e6ce5c7b))





# [1.11.0](http://github.com//cap-md089/evmplus-v6/compare/server-common@1.4.0...server-common@1.11.0) (2020-09-07)

### Bug Fixes

-   fixed error messages for most PAM apis by updating some functions to use AsyncEither ([1e19f85](http://github.com//cap-md089/evmplus-v6/commit/1e19f852ff73ad2cd0a45feed1df15a228b3a1bb))
-   fixed google calendar update tripping up on modifying registration and wing events ([03d87ee](http://github.com//cap-md089/evmplus-v6/commit/03d87ee8113bf748869e66ce2ddf76a324695913)), closes [#9](http://github.com//cap-md089/evmplus-v6/issues/9)
-   fixed ImportCAPWATCHFile types to more accurately reflect the types of a CAPWATCH CSV file ([fffae38](http://github.com//cap-md089/evmplus-v6/commit/fffae38d6ba729c7592b1567242e4ea97cfe185e))
-   fixed not being able to sign up for an account ([7f9938b](http://github.com//cap-md089/evmplus-v6/commit/7f9938be4aa41802f1c9ae9dddf613a1e727c1e6)), closes [#30](http://github.com//cap-md089/evmplus-v6/issues/30)
-   fixed user account sign ups ([ebf8821](http://github.com//cap-md089/evmplus-v6/commit/ebf882136c73c1c001ebadacb2945fb543c12854))
-   removed Wing calendar ([b7f6d84](http://github.com//cap-md089/evmplus-v6/commit/b7f6d84f1a9f203297111d9d2386ee5569434894)), closes [#24](http://github.com//cap-md089/evmplus-v6/issues/24)
-   **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/evmplus-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))

### Features

-   added attendancescanner ([70f9feb](http://github.com//cap-md089/evmplus-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/evmplus-v6/issues/19)
-   added MFA using an OTPA ([900239b](http://github.com//cap-md089/evmplus-v6/commit/900239b673598e22194bd0cb0edbdfef6a3d4cfa))
-   adding cadet promotion requirements display ([6659e57](http://github.com//cap-md089/evmplus-v6/commit/6659e571bcf938370ffb0954c053d24f907d24f4))
-   provided better copy event dialogues ([00901ec](http://github.com//cap-md089/evmplus-v6/commit/00901ec4028c18a5d3cabc990439d493f322b14e)), closes [#13](http://github.com//cap-md089/evmplus-v6/issues/13)
-   **new:** continued development on cadet promotion requirements ([67c0a78](http://github.com//cap-md089/evmplus-v6/commit/67c0a7891e6fca07454c48a0a182054dd45e87e8))
-   made PAM.RequireMemberType smarter ([fbbc6ed](http://github.com//cap-md089/evmplus-v6/commit/fbbc6eda975457e8fcee52c33d227c31e6ce5c7b))

# [1.10.0](http://github.com//cap-md089/evmplus-v6/compare/server-common@1.4.0...server-common@1.10.0) (2020-09-07)

### Bug Fixes

-   fixed error messages for most PAM apis by updating some functions to use AsyncEither ([1e19f85](http://github.com//cap-md089/evmplus-v6/commit/1e19f852ff73ad2cd0a45feed1df15a228b3a1bb))
-   fixed google calendar update tripping up on modifying registration and wing events ([03d87ee](http://github.com//cap-md089/evmplus-v6/commit/03d87ee8113bf748869e66ce2ddf76a324695913)), closes [#9](http://github.com//cap-md089/evmplus-v6/issues/9)
-   fixed ImportCAPWATCHFile types to more accurately reflect the types of a CAPWATCH CSV file ([fffae38](http://github.com//cap-md089/evmplus-v6/commit/fffae38d6ba729c7592b1567242e4ea97cfe185e))
-   fixed not being able to sign up for an account ([7f9938b](http://github.com//cap-md089/evmplus-v6/commit/7f9938be4aa41802f1c9ae9dddf613a1e727c1e6)), closes [#30](http://github.com//cap-md089/evmplus-v6/issues/30)
-   removed Wing calendar ([b7f6d84](http://github.com//cap-md089/evmplus-v6/commit/b7f6d84f1a9f203297111d9d2386ee5569434894)), closes [#24](http://github.com//cap-md089/evmplus-v6/issues/24)
-   **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/evmplus-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))

### Features

-   added attendancescanner ([70f9feb](http://github.com//cap-md089/evmplus-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/evmplus-v6/issues/19)
-   added MFA using an OTPA ([900239b](http://github.com//cap-md089/evmplus-v6/commit/900239b673598e22194bd0cb0edbdfef6a3d4cfa))
-   adding cadet promotion requirements display ([6659e57](http://github.com//cap-md089/evmplus-v6/commit/6659e571bcf938370ffb0954c053d24f907d24f4))
-   provided better copy event dialogues ([00901ec](http://github.com//cap-md089/evmplus-v6/commit/00901ec4028c18a5d3cabc990439d493f322b14e)), closes [#13](http://github.com//cap-md089/evmplus-v6/issues/13)
-   **new:** continued development on cadet promotion requirements ([67c0a78](http://github.com//cap-md089/evmplus-v6/commit/67c0a7891e6fca07454c48a0a182054dd45e87e8))
-   made PAM.RequireMemberType smarter ([fbbc6ed](http://github.com//cap-md089/evmplus-v6/commit/fbbc6eda975457e8fcee52c33d227c31e6ce5c7b))

# [1.9.0](http://github.com//cap-md089/evmplus-v6/compare/server-common@1.4.0...server-common@1.9.0) (2020-09-06)

### Bug Fixes

-   fixed error messages for most PAM apis by updating some functions to use AsyncEither ([1e19f85](http://github.com//cap-md089/evmplus-v6/commit/1e19f852ff73ad2cd0a45feed1df15a228b3a1bb))
-   fixed google calendar update tripping up on modifying registration and wing events ([03d87ee](http://github.com//cap-md089/evmplus-v6/commit/03d87ee8113bf748869e66ce2ddf76a324695913)), closes [#9](http://github.com//cap-md089/evmplus-v6/issues/9)
-   fixed ImportCAPWATCHFile types to more accurately reflect the types of a CAPWATCH CSV file ([fffae38](http://github.com//cap-md089/evmplus-v6/commit/fffae38d6ba729c7592b1567242e4ea97cfe185e))
-   removed Wing calendar ([b7f6d84](http://github.com//cap-md089/evmplus-v6/commit/b7f6d84f1a9f203297111d9d2386ee5569434894)), closes [#24](http://github.com//cap-md089/evmplus-v6/issues/24)
-   **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/evmplus-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))

### Features

-   added attendancescanner ([70f9feb](http://github.com//cap-md089/evmplus-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/evmplus-v6/issues/19)
-   added MFA using an OTPA ([900239b](http://github.com//cap-md089/evmplus-v6/commit/900239b673598e22194bd0cb0edbdfef6a3d4cfa))
-   made PAM.RequireMemberType smarter ([fbbc6ed](http://github.com//cap-md089/evmplus-v6/commit/fbbc6eda975457e8fcee52c33d227c31e6ce5c7b))
-   provided better copy event dialogues ([00901ec](http://github.com//cap-md089/evmplus-v6/commit/00901ec4028c18a5d3cabc990439d493f322b14e)), closes [#13](http://github.com//cap-md089/evmplus-v6/issues/13)

# [1.8.0](http://github.com//cap-md089/evmplus-v6/compare/server-common@1.4.0...server-common@1.8.0) (2020-09-02)

### Bug Fixes

-   fixed CAPWATCH import not deleting records properly ([dce238b](http://github.com//cap-md089/evmplus-v6/commit/dce238b0f92959a372e15551fbf66dc1e5c30374))
-   **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/evmplus-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))
-   fixed google calendar update tripping up on modifying registration and wing events ([03d87ee](http://github.com//cap-md089/evmplus-v6/commit/03d87ee8113bf748869e66ce2ddf76a324695913)), closes [#9](http://github.com//cap-md089/evmplus-v6/issues/9)
-   fixed ImportCAPWATCHFile types to more accurately reflect the types of a CAPWATCH CSV file ([fffae38](http://github.com//cap-md089/evmplus-v6/commit/fffae38d6ba729c7592b1567242e4ea97cfe185e))

### Features

-   added attendancescanner ([70f9feb](http://github.com//cap-md089/evmplus-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/evmplus-v6/issues/19)
-   made PAM.RequireMemberType smarter ([fbbc6ed](http://github.com//cap-md089/evmplus-v6/commit/fbbc6eda975457e8fcee52c33d227c31e6ce5c7b))

# [1.7.0](http://github.com//cap-md089/evmplus-v6/compare/server-common@1.4.0...server-common@1.7.0) (2020-09-01)

### Bug Fixes

-   fixed CAPWATCH import not deleting records properly ([dce238b](http://github.com//cap-md089/evmplus-v6/commit/dce238b0f92959a372e15551fbf66dc1e5c30374))
-   **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/evmplus-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))
-   fixed google calendar update tripping up on modifying registration and wing events ([03d87ee](http://github.com//cap-md089/evmplus-v6/commit/03d87ee8113bf748869e66ce2ddf76a324695913)), closes [#9](http://github.com//cap-md089/evmplus-v6/issues/9)
-   fixed ImportCAPWATCHFile types to more accurately reflect the types of a CAPWATCH CSV file ([fffae38](http://github.com//cap-md089/evmplus-v6/commit/fffae38d6ba729c7592b1567242e4ea97cfe185e))

### Features

-   added attendancescanner ([70f9feb](http://github.com//cap-md089/evmplus-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/evmplus-v6/issues/19)
-   made PAM.RequireMemberType smarter ([fbbc6ed](http://github.com//cap-md089/evmplus-v6/commit/fbbc6eda975457e8fcee52c33d227c31e6ce5c7b))

# [1.6.0](http://github.com//cap-md089/evmplus-v6/compare/server-common@1.4.0...server-common@1.6.0) (2020-08-31)

### Bug Fixes

-   **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/evmplus-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))
-   fixed google calendar update tripping up on modifying registration and wing events ([03d87ee](http://github.com//cap-md089/evmplus-v6/commit/03d87ee8113bf748869e66ce2ddf76a324695913)), closes [#9](http://github.com//cap-md089/evmplus-v6/issues/9)
-   fixed ImportCAPWATCHFile types to more accurately reflect the types of a CAPWATCH CSV file ([fffae38](http://github.com//cap-md089/evmplus-v6/commit/fffae38d6ba729c7592b1567242e4ea97cfe185e))

### Features

-   added attendancescanner ([70f9feb](http://github.com//cap-md089/evmplus-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/evmplus-v6/issues/19)
-   made PAM.RequireMemberType smarter ([fbbc6ed](http://github.com//cap-md089/evmplus-v6/commit/fbbc6eda975457e8fcee52c33d227c31e6ce5c7b))

# [1.5.0](http://github.com//cap-md089/evmplus-v6/compare/server-common@1.4.0...server-common@1.5.0) (2020-08-25)

### Bug Fixes

-   fixed google calendar update tripping up on modifying registration and wing events ([03d87ee](http://github.com//cap-md089/evmplus-v6/commit/03d87ee8113bf748869e66ce2ddf76a324695913)), closes [#9](http://github.com//cap-md089/evmplus-v6/issues/9)

### Features

-   made PAM.RequireMemberType smarter ([fbbc6ed](http://github.com//cap-md089/evmplus-v6/commit/fbbc6eda975457e8fcee52c33d227c31e6ce5c7b))

# [1.4.0](http://github.com//cap-md089/evmplus-v6/compare/server-common@1.3.0...server-common@1.4.0) (2020-08-17)

### Bug Fixes

-   removed wing calendar from wing and region accounts and their events ([8975b7c](http://github.com//cap-md089/evmplus-v6/commit/8975b7c69efa955f87433244cef7f6460bdc6ae1)), closes [#6](http://github.com//cap-md089/evmplus-v6/issues/6)
-   **eventviewer:** fixed eventviewer updating client side state in a weird way ([aa3b763](http://github.com//cap-md089/evmplus-v6/commit/aa3b7632b49eb0b65d5bf2481a61c688bd8cbb6b)), closes [#3](http://github.com//cap-md089/evmplus-v6/issues/3)
-   **permissions:** fixed client acting like all members had all permissions ([fcc59ea](http://github.com//cap-md089/evmplus-v6/commit/fcc59ea127eb7cec3e0973b7f7797f6e6080483f))

### Features

-   **prospectivemembers:** added a prospective member management page ([73b07b3](http://github.com//cap-md089/evmplus-v6/commit/73b07b3b9077ba52e82849a97463225c4a68154d)), closes [#4](http://github.com//cap-md089/evmplus-v6/issues/4)

## [1.3.1](http://github.com//cap-md089/evmplus-v6/compare/server-common@1.3.0...server-common@1.3.1) (2020-08-13)

**Note:** Version bump only for package server-common

# 1.3.0 (2020-08-11)

### Bug Fixes

-   updated TypeScript for all packages to 3.9 ([12ee6e6](http://github.com//cap-md089/evmplus-v6/commit/12ee6e67d9669d73d849791cf22637357dd4ae30))
-   **eventviewer:** fixed team leaders not being able to sign up to events limited to their team ([ea9ae4a](http://github.com//cap-md089/evmplus-v6/commit/ea9ae4a520e386f010b1e620a706c1762052c7c4))
-   **prospectivemembers:** fixed creation of prospective members ([042b39a](http://github.com//cap-md089/evmplus-v6/commit/042b39af12ad8022ec391c0e8562a83d5211f53b))
-   **teams:** fixed team edit and discord role updates ([ef2c7a7](http://github.com//cap-md089/evmplus-v6/commit/ef2c7a78ddb3d9b8155218eb9540fbdd820e240c))
-   Fixed link event not showing up ([143df6f](http://github.com//cap-md089/evmplus-v6/commit/143df6f6daaf7975fff3e58c68c888a226d8b31a))

### Features

-   **eventviewer:** eventViewer now shows all events that are linked to the event being viewed ([979dc77](http://github.com//cap-md089/evmplus-v6/commit/979dc771ed2b4ce4c652536ea589c0c1de64d3ac))

# 1.2.0 (2020-08-11)

### Bug Fixes

-   updated TypeScript for all packages to 3.9 ([12ee6e6](http://github.com//cap-md089/evmplus-v6/commit/12ee6e67d9669d73d849791cf22637357dd4ae30))
-   **eventviewer:** fixed team leaders not being able to sign up to events limited to their team ([ea9ae4a](http://github.com//cap-md089/evmplus-v6/commit/ea9ae4a520e386f010b1e620a706c1762052c7c4))
-   **prospectivemembers:** fixed creation of prospective members ([042b39a](http://github.com//cap-md089/evmplus-v6/commit/042b39af12ad8022ec391c0e8562a83d5211f53b))
-   **teams:** fixed team edit and discord role updates ([ef2c7a7](http://github.com//cap-md089/evmplus-v6/commit/ef2c7a78ddb3d9b8155218eb9540fbdd820e240c))
-   Fixed link event not showing up ([143df6f](http://github.com//cap-md089/evmplus-v6/commit/143df6f6daaf7975fff3e58c68c888a226d8b31a))

### Features

-   **eventviewer:** eventViewer now shows all events that are linked to the event being viewed ([979dc77](http://github.com//cap-md089/evmplus-v6/commit/979dc771ed2b4ce4c652536ea589c0c1de64d3ac))
