# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.28.0](http://github.com//cap-md089/evmplus-v6/compare/common-lib@1.19.0...common-lib@1.28.0) (2021-06-27)


### Bug Fixes

* **server-common:** fixed code to match tests ([d2edf8d](http://github.com//cap-md089/evmplus-v6/commit/d2edf8d2e226d5a849c30d8b3b5256a421de6df0))
* ensured that the attendance filters are in place in the server code ([21e1acf](http://github.com//cap-md089/evmplus-v6/commit/21e1acf73f9f88e6402a236643a050ae0a724a1e))
* found that eslint wasn't checking certain files ([25be1cc](http://github.com//cap-md089/evmplus-v6/commit/25be1cc5b028540339a05dc713563b88d226e214))
* **capwatch import:** fix capwatch cadet hfz import ([e4fba7a](http://github.com//cap-md089/evmplus-v6/commit/e4fba7a5bfc32c69385098e7d67b61dc1e024cf4)), closes [#101](http://github.com//cap-md089/evmplus-v6/issues/101)
* **client:** replaced references to old name with new name ([6752957](http://github.com//cap-md089/evmplus-v6/commit/675295781f3d0c5c8c838c09f76daa3ab974e558))
* **client-server:** added 'position' field for POC entries in events ([b09d475](http://github.com//cap-md089/evmplus-v6/commit/b09d47510315147e048a0f70c5cdbdcaf9514c09)), closes [#143](http://github.com//cap-md089/evmplus-v6/issues/143)
* **common-lib:** provided better filtering for event information ([945d32a](http://github.com//cap-md089/evmplus-v6/commit/945d32a98c49e8717528e66787d6a4ec8d1131c1))
* **server:** fixed session timeout for scan add sessions ([84fb4d8](http://github.com//cap-md089/evmplus-v6/commit/84fb4d8bcefced80dca17822063bb036d83f0570))
* **server:** fixed when finishing account setup or password reset not immediately being signed in as ([f58fa55](http://github.com//cap-md089/evmplus-v6/commit/f58fa5501c3df8d6506e52a07fac25a4781692f3))
* fixed code to match data ([b7bd7b9](http://github.com//cap-md089/evmplus-v6/commit/b7bd7b9c118deba04b30804ab9273122478839dd))
* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))
* fixed merge pains ([cdba40d](http://github.com//cap-md089/evmplus-v6/commit/cdba40d4fbdea24785683e52ad4c907472b43945))
* fixed weird rendering ([7ac923a](http://github.com//cap-md089/evmplus-v6/commit/7ac923acd9b9c48435b0a40762a2ece3ea85a707))
* removed unused contact types ([0cf2f68](http://github.com//cap-md089/evmplus-v6/commit/0cf2f68c178d7334f3db10211ec4f372fa3bf8d3))
* **server:** fixed admins not being able to link events ([cc1c48f](http://github.com//cap-md089/evmplus-v6/commit/cc1c48ffc36b547f28c0a53fd452925f23605277))
* updated jest dependencies, fixed jest for client ([b98c96a](http://github.com//cap-md089/evmplus-v6/commit/b98c96a97dac6840308775bad73aec6801391690))


### Features

* re-added public display option for POCs and fixed copy event bug ([0514f44](http://github.com//cap-md089/evmplus-v6/commit/0514f44a0d1e979ac03c22aa13ee1b9b83340951))
* **attendance spreadsheet download:** included comments in attendance spreadsheet download ([f6a9b27](http://github.com//cap-md089/evmplus-v6/commit/f6a9b27ccc95607094f0477ee8aaad7555e328e3))
* **client and server:** added links and display to view event audit information ([16784ec](http://github.com//cap-md089/evmplus-v6/commit/16784ecb2f8b59f905e548a75a0a8a9c1f7695d9))
* **common-lib:** added the ability to filter types as well as values for AsyncEither ([c65a551](http://github.com//cap-md089/evmplus-v6/commit/c65a551c9c0fd2d759ff9cbb5700dad977bb04d5))
* **debriefs:** added debrief functionality to EventViewer and EventLinkList ([42ea511](http://github.com//cap-md089/evmplus-v6/commit/42ea5111f0e985c6a9116007ad4efd40231c8e3e)), closes [#65](http://github.com//cap-md089/evmplus-v6/issues/65)
* **eventform:** added functionality to add internal member as poc by capid ([c6d1021](http://github.com//cap-md089/evmplus-v6/commit/c6d10214f182ad6809c818060203e31436299c99)), closes [#37](http://github.com//cap-md089/evmplus-v6/issues/37)
* **EventForm, viewer, linklist:** added indication of which fields are written to Google Calendar, ([b4a1d64](http://github.com//cap-md089/evmplus-v6/commit/b4a1d6466c4ea66af820b6979a62345966ba392e)), closes [#81](http://github.com//cap-md089/evmplus-v6/issues/81) [#80](http://github.com//cap-md089/evmplus-v6/issues/80)
* **eventviewer:** removed linked events links ([b89016e](http://github.com//cap-md089/evmplus-v6/commit/b89016e158d2ad9c11dc799d372fd6655992fa12))
* **eventviewer and linklist changes in line with mdwg business rules:** eventviewer and linklist ch ([d21210d](http://github.com//cap-md089/evmplus-v6/commit/d21210db05d89a340a3288acad5555cdde01edf6))
* **eventviewer, eventform, attendancemultiadd, attendancexls:** multiple EventViewer interface and ([e1a0eca](http://github.com//cap-md089/evmplus-v6/commit/e1a0ecadd76fdf7337f73c3e521995a6ded9972d)), closes [#71](http://github.com//cap-md089/evmplus-v6/issues/71) [#72](http://github.com//cap-md089/evmplus-v6/issues/72) [#73](http://github.com//cap-md089/evmplus-v6/issues/73) [#74](http://github.com//cap-md089/evmplus-v6/issues/74) [#75](http://github.com//cap-md089/evmplus-v6/issues/75)
* **import hfz information:** added functionality to import HFZ information file from CAPWATCH ([f5ae56d](http://github.com//cap-md089/evmplus-v6/commit/f5ae56dc7ff97befd2f94c644a08ac9469f0007e))
* **server:** added attendance unit tests ([f1d742f](http://github.com//cap-md089/evmplus-v6/commit/f1d742fdbe27b9776abef1e2a1a98612b9102eac))
* **server client common-lib:** implemented email notification of event sign up ([da85e04](http://github.com//cap-md089/evmplus-v6/commit/da85e041bc841e6ee5eacb777f009197b9359774))
* **server-jest-config:** added extra data functions to help with generating server side tests ([f9ed16d](http://github.com//cap-md089/evmplus-v6/commit/f9ed16d8b1ca7a9f95c0a2fcac4d9197f59eb380))
* added the ability to generate preset data for tests ([4ae8a29](http://github.com//cap-md089/evmplus-v6/commit/4ae8a29f972f120ee62f8217ca956edde80ef1af))
* **server-common:** adding more backends and more things using backends ([ea37ec5](http://github.com//cap-md089/evmplus-v6/commit/ea37ec591b8bc770703eb949103dc4ef3688e721))
* added the ability to modify linked events ([c219817](http://github.com//cap-md089/evmplus-v6/commit/c219817c51c189f84ce04876be2b56ecd1dcd2a0))
* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# [1.27.0](http://github.com//cap-md089/evmplus-v6/compare/common-lib@1.19.0...common-lib@1.27.0) (2021-03-15)


### Bug Fixes

* **client-server:** added 'position' field for POC entries in events ([b09d475](http://github.com//cap-md089/evmplus-v6/commit/b09d47510315147e048a0f70c5cdbdcaf9514c09)), closes [#143](http://github.com//cap-md089/evmplus-v6/issues/143)
* **server:** fixed when finishing account setup or password reset not immediately being signed in as ([f58fa55](http://github.com//cap-md089/evmplus-v6/commit/f58fa5501c3df8d6506e52a07fac25a4781692f3))
* fixed merge pains ([cdba40d](http://github.com//cap-md089/evmplus-v6/commit/cdba40d4fbdea24785683e52ad4c907472b43945))
* removed unused contact types ([0cf2f68](http://github.com//cap-md089/evmplus-v6/commit/0cf2f68c178d7334f3db10211ec4f372fa3bf8d3))
* **capwatch import:** fix capwatch cadet hfz import ([e4fba7a](http://github.com//cap-md089/evmplus-v6/commit/e4fba7a5bfc32c69385098e7d67b61dc1e024cf4)), closes [#101](http://github.com//cap-md089/evmplus-v6/issues/101)
* **client:** replaced references to old name with new name ([6752957](http://github.com//cap-md089/evmplus-v6/commit/675295781f3d0c5c8c838c09f76daa3ab974e558))
* **server:** fixed admins not being able to link events ([cc1c48f](http://github.com//cap-md089/evmplus-v6/commit/cc1c48ffc36b547f28c0a53fd452925f23605277))
* fixed code to match data ([b7bd7b9](http://github.com//cap-md089/evmplus-v6/commit/b7bd7b9c118deba04b30804ab9273122478839dd))
* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))
* fixed weird rendering ([7ac923a](http://github.com//cap-md089/evmplus-v6/commit/7ac923acd9b9c48435b0a40762a2ece3ea85a707))
* updated jest dependencies, fixed jest for client ([b98c96a](http://github.com//cap-md089/evmplus-v6/commit/b98c96a97dac6840308775bad73aec6801391690))


### Features

* **attendance spreadsheet download:** included comments in attendance spreadsheet download ([f6a9b27](http://github.com//cap-md089/evmplus-v6/commit/f6a9b27ccc95607094f0477ee8aaad7555e328e3))
* **client and server:** added links and display to view event audit information ([16784ec](http://github.com//cap-md089/evmplus-v6/commit/16784ecb2f8b59f905e548a75a0a8a9c1f7695d9))
* **debriefs:** added debrief functionality to EventViewer and EventLinkList ([42ea511](http://github.com//cap-md089/evmplus-v6/commit/42ea5111f0e985c6a9116007ad4efd40231c8e3e)), closes [#65](http://github.com//cap-md089/evmplus-v6/issues/65)
* **eventform:** added functionality to add internal member as poc by capid ([c6d1021](http://github.com//cap-md089/evmplus-v6/commit/c6d10214f182ad6809c818060203e31436299c99)), closes [#37](http://github.com//cap-md089/evmplus-v6/issues/37)
* **EventForm, viewer, linklist:** added indication of which fields are written to Google Calendar, ([b4a1d64](http://github.com//cap-md089/evmplus-v6/commit/b4a1d6466c4ea66af820b6979a62345966ba392e)), closes [#81](http://github.com//cap-md089/evmplus-v6/issues/81) [#80](http://github.com//cap-md089/evmplus-v6/issues/80)
* **eventviewer:** removed linked events links ([b89016e](http://github.com//cap-md089/evmplus-v6/commit/b89016e158d2ad9c11dc799d372fd6655992fa12))
* **eventviewer and linklist changes in line with mdwg business rules:** eventviewer and linklist ch ([d21210d](http://github.com//cap-md089/evmplus-v6/commit/d21210db05d89a340a3288acad5555cdde01edf6))
* **eventviewer, eventform, attendancemultiadd, attendancexls:** multiple EventViewer interface and ([e1a0eca](http://github.com//cap-md089/evmplus-v6/commit/e1a0ecadd76fdf7337f73c3e521995a6ded9972d)), closes [#71](http://github.com//cap-md089/evmplus-v6/issues/71) [#72](http://github.com//cap-md089/evmplus-v6/issues/72) [#73](http://github.com//cap-md089/evmplus-v6/issues/73) [#74](http://github.com//cap-md089/evmplus-v6/issues/74) [#75](http://github.com//cap-md089/evmplus-v6/issues/75)
* **import hfz information:** added functionality to import HFZ information file from CAPWATCH ([f5ae56d](http://github.com//cap-md089/evmplus-v6/commit/f5ae56dc7ff97befd2f94c644a08ac9469f0007e))
* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# [1.26.0](http://github.com//cap-md089/evmplus-v6/compare/common-lib@1.19.0...common-lib@1.26.0) (2020-12-09)


### Bug Fixes

* **capwatch import:** fix capwatch cadet hfz import ([e4fba7a](http://github.com//cap-md089/evmplus-v6/commit/e4fba7a5bfc32c69385098e7d67b61dc1e024cf4)), closes [#101](http://github.com//cap-md089/evmplus-v6/issues/101)
* **client:** replaced references to old name with new name ([6752957](http://github.com//cap-md089/evmplus-v6/commit/675295781f3d0c5c8c838c09f76daa3ab974e558))
* **server:** fixed admins not being able to link events ([cc1c48f](http://github.com//cap-md089/evmplus-v6/commit/cc1c48ffc36b547f28c0a53fd452925f23605277))
* **server:** fixed headers not being properly handled ([d0829e9](http://github.com//cap-md089/evmplus-v6/commit/d0829e9c94399c402388c26ec05512e53153615b))
* fixed code to match data ([b7bd7b9](http://github.com//cap-md089/evmplus-v6/commit/b7bd7b9c118deba04b30804ab9273122478839dd))
* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))
* fixed weird rendering ([7ac923a](http://github.com//cap-md089/evmplus-v6/commit/7ac923acd9b9c48435b0a40762a2ece3ea85a707))
* updated jest dependencies, fixed jest for client ([b98c96a](http://github.com//cap-md089/evmplus-v6/commit/b98c96a97dac6840308775bad73aec6801391690))


### Features

* **attendance spreadsheet download:** included comments in attendance spreadsheet download ([f6a9b27](http://github.com//cap-md089/evmplus-v6/commit/f6a9b27ccc95607094f0477ee8aaad7555e328e3))
* **eventform:** added functionality to add internal member as poc by capid ([c6d1021](http://github.com//cap-md089/evmplus-v6/commit/c6d10214f182ad6809c818060203e31436299c99)), closes [#37](http://github.com//cap-md089/evmplus-v6/issues/37)
* **EventForm, viewer, linklist:** added indication of which fields are written to Google Calendar, ([b4a1d64](http://github.com//cap-md089/evmplus-v6/commit/b4a1d6466c4ea66af820b6979a62345966ba392e)), closes [#81](http://github.com//cap-md089/evmplus-v6/issues/81) [#80](http://github.com//cap-md089/evmplus-v6/issues/80)
* **eventviewer and linklist changes in line with mdwg business rules:** eventviewer and linklist ch ([d21210d](http://github.com//cap-md089/evmplus-v6/commit/d21210db05d89a340a3288acad5555cdde01edf6))
* **eventviewer, eventform, attendancemultiadd, attendancexls:** multiple EventViewer interface and ([e1a0eca](http://github.com//cap-md089/evmplus-v6/commit/e1a0ecadd76fdf7337f73c3e521995a6ded9972d)), closes [#71](http://github.com//cap-md089/evmplus-v6/issues/71) [#72](http://github.com//cap-md089/evmplus-v6/issues/72) [#73](http://github.com//cap-md089/evmplus-v6/issues/73) [#74](http://github.com//cap-md089/evmplus-v6/issues/74) [#75](http://github.com//cap-md089/evmplus-v6/issues/75)
* **import hfz information:** added functionality to import HFZ information file from CAPWATCH ([f5ae56d](http://github.com//cap-md089/evmplus-v6/commit/f5ae56dc7ff97befd2f94c644a08ac9469f0007e))
* **server-common:** added extra configuration for different drive locations ([fa8d141](http://github.com//cap-md089/evmplus-v6/commit/fa8d141580c801766af94f405c5e285085c5a885))
* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# [1.25.0](http://github.com//cap-md089/evmplus-v6/compare/common-lib@1.19.0...common-lib@1.25.0) (2020-10-30)


### Bug Fixes

* fixed code to match data ([b7bd7b9](http://github.com//cap-md089/evmplus-v6/commit/b7bd7b9c118deba04b30804ab9273122478839dd))
* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))
* fixed weird rendering ([7ac923a](http://github.com//cap-md089/evmplus-v6/commit/7ac923acd9b9c48435b0a40762a2ece3ea85a707))
* updated jest dependencies, fixed jest for client ([b98c96a](http://github.com//cap-md089/evmplus-v6/commit/b98c96a97dac6840308775bad73aec6801391690))


### Features

* **eventform:** added functionality to add internal member as poc by capid ([c6d1021](http://github.com//cap-md089/evmplus-v6/commit/c6d10214f182ad6809c818060203e31436299c99)), closes [#37](http://github.com//cap-md089/evmplus-v6/issues/37)
* **EventForm, viewer, linklist:** added indication of which fields are written to Google Calendar, ([b4a1d64](http://github.com//cap-md089/evmplus-v6/commit/b4a1d6466c4ea66af820b6979a62345966ba392e)), closes [#81](http://github.com//cap-md089/evmplus-v6/issues/81) [#80](http://github.com//cap-md089/evmplus-v6/issues/80)
* **eventviewer and linklist changes in line with mdwg business rules:** eventviewer and linklist ch ([d21210d](http://github.com//cap-md089/evmplus-v6/commit/d21210db05d89a340a3288acad5555cdde01edf6))
* **eventviewer, eventform, attendancemultiadd, attendancexls:** multiple EventViewer interface and ([e1a0eca](http://github.com//cap-md089/evmplus-v6/commit/e1a0ecadd76fdf7337f73c3e521995a6ded9972d)), closes [#71](http://github.com//cap-md089/evmplus-v6/issues/71) [#72](http://github.com//cap-md089/evmplus-v6/issues/72) [#73](http://github.com//cap-md089/evmplus-v6/issues/73) [#74](http://github.com//cap-md089/evmplus-v6/issues/74) [#75](http://github.com//cap-md089/evmplus-v6/issues/75)
* **import hfz information:** added functionality to import HFZ information file from CAPWATCH ([f5ae56d](http://github.com//cap-md089/evmplus-v6/commit/f5ae56dc7ff97befd2f94c644a08ac9469f0007e))
* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# [1.24.0](http://github.com//cap-md089/evmplus-v6/compare/common-lib@1.19.0...common-lib@1.24.0) (2020-10-29)


### Bug Fixes

* fixed code to match data ([b7bd7b9](http://github.com//cap-md089/evmplus-v6/commit/b7bd7b9c118deba04b30804ab9273122478839dd))
* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))
* fixed weird rendering ([7ac923a](http://github.com//cap-md089/evmplus-v6/commit/7ac923acd9b9c48435b0a40762a2ece3ea85a707))
* updated jest dependencies, fixed jest for client ([b98c96a](http://github.com//cap-md089/evmplus-v6/commit/b98c96a97dac6840308775bad73aec6801391690))


### Features

* **eventform:** added functionality to add internal member as poc by capid ([c6d1021](http://github.com//cap-md089/evmplus-v6/commit/c6d10214f182ad6809c818060203e31436299c99)), closes [#37](http://github.com//cap-md089/evmplus-v6/issues/37)
* **EventForm, viewer, linklist:** added indication of which fields are written to Google Calendar, ([b4a1d64](http://github.com//cap-md089/evmplus-v6/commit/b4a1d6466c4ea66af820b6979a62345966ba392e)), closes [#81](http://github.com//cap-md089/evmplus-v6/issues/81) [#80](http://github.com//cap-md089/evmplus-v6/issues/80)
* **eventviewer and linklist changes in line with mdwg business rules:** eventviewer and linklist ch ([d21210d](http://github.com//cap-md089/evmplus-v6/commit/d21210db05d89a340a3288acad5555cdde01edf6))
* **eventviewer, eventform, attendancemultiadd, attendancexls:** multiple EventViewer interface and ([e1a0eca](http://github.com//cap-md089/evmplus-v6/commit/e1a0ecadd76fdf7337f73c3e521995a6ded9972d)), closes [#71](http://github.com//cap-md089/evmplus-v6/issues/71) [#72](http://github.com//cap-md089/evmplus-v6/issues/72) [#73](http://github.com//cap-md089/evmplus-v6/issues/73) [#74](http://github.com//cap-md089/evmplus-v6/issues/74) [#75](http://github.com//cap-md089/evmplus-v6/issues/75)
* **import hfz information:** added functionality to import HFZ information file from CAPWATCH ([f5ae56d](http://github.com//cap-md089/evmplus-v6/commit/f5ae56dc7ff97befd2f94c644a08ac9469f0007e))
* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# [1.23.0](http://github.com//cap-md089/evmplus-v6/compare/common-lib@1.19.0...common-lib@1.23.0) (2020-10-27)


### Bug Fixes

* fixed code to match data ([b7bd7b9](http://github.com//cap-md089/evmplus-v6/commit/b7bd7b9c118deba04b30804ab9273122478839dd))
* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))
* fixed weird rendering ([7ac923a](http://github.com//cap-md089/evmplus-v6/commit/7ac923acd9b9c48435b0a40762a2ece3ea85a707))
* updated jest dependencies, fixed jest for client ([b98c96a](http://github.com//cap-md089/evmplus-v6/commit/b98c96a97dac6840308775bad73aec6801391690))


### Features

* **eventform:** added functionality to add internal member as poc by capid ([c6d1021](http://github.com//cap-md089/evmplus-v6/commit/c6d10214f182ad6809c818060203e31436299c99)), closes [#37](http://github.com//cap-md089/evmplus-v6/issues/37)
* **EventForm, viewer, linklist:** added indication of which fields are written to Google Calendar, ([b4a1d64](http://github.com//cap-md089/evmplus-v6/commit/b4a1d6466c4ea66af820b6979a62345966ba392e)), closes [#81](http://github.com//cap-md089/evmplus-v6/issues/81) [#80](http://github.com//cap-md089/evmplus-v6/issues/80)
* **eventviewer and linklist changes in line with mdwg business rules:** eventviewer and linklist ch ([d21210d](http://github.com//cap-md089/evmplus-v6/commit/d21210db05d89a340a3288acad5555cdde01edf6))
* **eventviewer, eventform, attendancemultiadd, attendancexls:** multiple EventViewer interface and ([e1a0eca](http://github.com//cap-md089/evmplus-v6/commit/e1a0ecadd76fdf7337f73c3e521995a6ded9972d)), closes [#71](http://github.com//cap-md089/evmplus-v6/issues/71) [#72](http://github.com//cap-md089/evmplus-v6/issues/72) [#73](http://github.com//cap-md089/evmplus-v6/issues/73) [#74](http://github.com//cap-md089/evmplus-v6/issues/74) [#75](http://github.com//cap-md089/evmplus-v6/issues/75)
* **import hfz information:** added functionality to import HFZ information file from CAPWATCH ([f5ae56d](http://github.com//cap-md089/evmplus-v6/commit/f5ae56dc7ff97befd2f94c644a08ac9469f0007e))
* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# [1.22.0](http://github.com//cap-md089/evmplus-v6/compare/common-lib@1.19.0...common-lib@1.22.0) (2020-10-16)


### Bug Fixes

* fixed code to match data ([b7bd7b9](http://github.com//cap-md089/evmplus-v6/commit/b7bd7b9c118deba04b30804ab9273122478839dd))
* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))


### Features

* **EventForm, viewer, linklist:** added indication of which fields are written to Google Calendar, ([b4a1d64](http://github.com//cap-md089/evmplus-v6/commit/b4a1d6466c4ea66af820b6979a62345966ba392e)), closes [#81](http://github.com//cap-md089/evmplus-v6/issues/81) [#80](http://github.com//cap-md089/evmplus-v6/issues/80)
* **eventviewer and linklist changes in line with mdwg business rules:** eventviewer and linklist ch ([d21210d](http://github.com//cap-md089/evmplus-v6/commit/d21210db05d89a340a3288acad5555cdde01edf6))
* **eventviewer, eventform, attendancemultiadd, attendancexls:** multiple EventViewer interface and ([e1a0eca](http://github.com//cap-md089/evmplus-v6/commit/e1a0ecadd76fdf7337f73c3e521995a6ded9972d)), closes [#71](http://github.com//cap-md089/evmplus-v6/issues/71) [#72](http://github.com//cap-md089/evmplus-v6/issues/72) [#73](http://github.com//cap-md089/evmplus-v6/issues/73) [#74](http://github.com//cap-md089/evmplus-v6/issues/74) [#75](http://github.com//cap-md089/evmplus-v6/issues/75)
* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# [1.21.0](http://github.com//cap-md089/evmplus-v6/compare/common-lib@1.19.0...common-lib@1.21.0) (2020-10-08)


### Bug Fixes

* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))


### Features

* **eventviewer, eventform, attendancemultiadd, attendancexls:** multiple EventViewer interface and ([e1a0eca](http://github.com//cap-md089/evmplus-v6/commit/e1a0ecadd76fdf7337f73c3e521995a6ded9972d)), closes [#71](http://github.com//cap-md089/evmplus-v6/issues/71) [#72](http://github.com//cap-md089/evmplus-v6/issues/72) [#73](http://github.com//cap-md089/evmplus-v6/issues/73) [#74](http://github.com//cap-md089/evmplus-v6/issues/74) [#75](http://github.com//cap-md089/evmplus-v6/issues/75)
* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# [1.20.0](http://github.com//cap-md089/evmplus-v6/compare/common-lib@1.19.0...common-lib@1.20.0) (2020-10-06)


### Bug Fixes

* fixed errors provided by refactor ([e138d41](http://github.com//cap-md089/evmplus-v6/commit/e138d411ce31460f3ff4c391b06937a535651c32))


### Features

* **eventviewer, eventform, attendancemultiadd, attendancexls:** multiple EventViewer interface and ([e1a0eca](http://github.com//cap-md089/evmplus-v6/commit/e1a0ecadd76fdf7337f73c3e521995a6ded9972d)), closes [#71](http://github.com//cap-md089/evmplus-v6/issues/71) [#72](http://github.com//cap-md089/evmplus-v6/issues/72) [#73](http://github.com//cap-md089/evmplus-v6/issues/73) [#74](http://github.com//cap-md089/evmplus-v6/issues/74) [#75](http://github.com//cap-md089/evmplus-v6/issues/75)
* added the ability to, given a public/private key pair, sign in skipping reCAPTCHA ([e1ae8fc](http://github.com//cap-md089/evmplus-v6/commit/e1ae8fcfc8cb4012a37efc906e4cf0bc7e5c38f8))





# [1.19.0](http://github.com//cap-md089/evmplus-v6/compare/common-lib@1.7.0...common-lib@1.19.0) (2020-09-29)


### Bug Fixes

* fixed event website not displaying on the eventviewer ([9aeb97b](http://github.com//cap-md089/evmplus-v6/commit/9aeb97beff013dc4808e8c481155d95f1d7cd980)), closes [#43](http://github.com//cap-md089/evmplus-v6/issues/43)
* fixed ImportCAPWATCHFile types to more accurately reflect the types of a CAPWATCH CSV file ([fffae38](http://github.com//cap-md089/evmplus-v6/commit/fffae38d6ba729c7592b1567242e4ea97cfe185e))
* fixed linking events and attendance management ([78cb150](http://github.com//cap-md089/evmplus-v6/commit/78cb150039463240ef89b493d842d185c3b3d36a))
* fixed time representation in Google calendar item description blocks ([c70773b](http://github.com//cap-md089/evmplus-v6/commit/c70773b5233aeba39d0656ae6d4eb87b423a5093)), closes [#44](http://github.com//cap-md089/evmplus-v6/issues/44)
* removed Wing calendar ([b7f6d84](http://github.com//cap-md089/evmplus-v6/commit/b7f6d84f1a9f203297111d9d2386ee5569434894)), closes [#24](http://github.com//cap-md089/evmplus-v6/issues/24)
* **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/evmplus-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))


### Features

* **event form and viewer:** multiple event field updates ([81c1840](http://github.com//cap-md089/evmplus-v6/commit/81c184029a600c8057bfe943006bfcec82ef3389)), closes [#47](http://github.com//cap-md089/evmplus-v6/issues/47) [#46](http://github.com//cap-md089/evmplus-v6/issues/46) [#35](http://github.com//cap-md089/evmplus-v6/issues/35)
* **signin:** added sign in logging ([c48fd90](http://github.com//cap-md089/evmplus-v6/commit/c48fd904a5b6c3f6a118ff74ebca88dc726dae41)), closes [#26](http://github.com//cap-md089/evmplus-v6/issues/26)
* added attendancescanner ([70f9feb](http://github.com//cap-md089/evmplus-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/evmplus-v6/issues/19)
* adding cadet promotion requirements display ([6659e57](http://github.com//cap-md089/evmplus-v6/commit/6659e571bcf938370ffb0954c053d24f907d24f4))
* completed adding Cadet Promotion Requirements display on Main ([f2982b1](http://github.com//cap-md089/evmplus-v6/commit/f2982b1cc97dbce6d2b31f432e91499bfd39f627)), closes [#5](http://github.com//cap-md089/evmplus-v6/issues/5)
* provided better copy event dialogues ([00901ec](http://github.com//cap-md089/evmplus-v6/commit/00901ec4028c18a5d3cabc990439d493f322b14e)), closes [#13](http://github.com//cap-md089/evmplus-v6/issues/13)
* **main.tsx:** continued work on adding cadet promotion requirements to main page ([47c96f3](http://github.com//cap-md089/evmplus-v6/commit/47c96f39f818e479c5ea774f21babec1322d9e6a))
* added MFA using an OTPA ([900239b](http://github.com//cap-md089/evmplus-v6/commit/900239b673598e22194bd0cb0edbdfef6a3d4cfa))
* **new:** continued development on cadet promotion requirements ([67c0a78](http://github.com//cap-md089/evmplus-v6/commit/67c0a7891e6fca07454c48a0a182054dd45e87e8))
* made PAM.RequireMemberType smarter ([fbbc6ed](http://github.com//cap-md089/evmplus-v6/commit/fbbc6eda975457e8fcee52c33d227c31e6ce5c7b))





# [1.18.0](http://github.com//cap-md089/evmplus-v6/compare/common-lib@1.7.0...common-lib@1.18.0) (2020-09-28)


### Bug Fixes

* fixed event website not displaying on the eventviewer ([9aeb97b](http://github.com//cap-md089/evmplus-v6/commit/9aeb97beff013dc4808e8c481155d95f1d7cd980)), closes [#43](http://github.com//cap-md089/evmplus-v6/issues/43)
* fixed ImportCAPWATCHFile types to more accurately reflect the types of a CAPWATCH CSV file ([fffae38](http://github.com//cap-md089/evmplus-v6/commit/fffae38d6ba729c7592b1567242e4ea97cfe185e))
* fixed linking events and attendance management ([78cb150](http://github.com//cap-md089/evmplus-v6/commit/78cb150039463240ef89b493d842d185c3b3d36a))
* fixed time representation in Google calendar item description blocks ([c70773b](http://github.com//cap-md089/evmplus-v6/commit/c70773b5233aeba39d0656ae6d4eb87b423a5093)), closes [#44](http://github.com//cap-md089/evmplus-v6/issues/44)
* removed Wing calendar ([b7f6d84](http://github.com//cap-md089/evmplus-v6/commit/b7f6d84f1a9f203297111d9d2386ee5569434894)), closes [#24](http://github.com//cap-md089/evmplus-v6/issues/24)
* **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/evmplus-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))


### Features

* **signin:** added sign in logging ([c48fd90](http://github.com//cap-md089/evmplus-v6/commit/c48fd904a5b6c3f6a118ff74ebca88dc726dae41)), closes [#26](http://github.com//cap-md089/evmplus-v6/issues/26)
* added attendancescanner ([70f9feb](http://github.com//cap-md089/evmplus-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/evmplus-v6/issues/19)
* adding cadet promotion requirements display ([6659e57](http://github.com//cap-md089/evmplus-v6/commit/6659e571bcf938370ffb0954c053d24f907d24f4))
* completed adding Cadet Promotion Requirements display on Main ([f2982b1](http://github.com//cap-md089/evmplus-v6/commit/f2982b1cc97dbce6d2b31f432e91499bfd39f627)), closes [#5](http://github.com//cap-md089/evmplus-v6/issues/5)
* made PAM.RequireMemberType smarter ([fbbc6ed](http://github.com//cap-md089/evmplus-v6/commit/fbbc6eda975457e8fcee52c33d227c31e6ce5c7b))
* provided better copy event dialogues ([00901ec](http://github.com//cap-md089/evmplus-v6/commit/00901ec4028c18a5d3cabc990439d493f322b14e)), closes [#13](http://github.com//cap-md089/evmplus-v6/issues/13)
* **main.tsx:** continued work on adding cadet promotion requirements to main page ([47c96f3](http://github.com//cap-md089/evmplus-v6/commit/47c96f39f818e479c5ea774f21babec1322d9e6a))
* added MFA using an OTPA ([900239b](http://github.com//cap-md089/evmplus-v6/commit/900239b673598e22194bd0cb0edbdfef6a3d4cfa))
* **new:** continued development on cadet promotion requirements ([67c0a78](http://github.com//cap-md089/evmplus-v6/commit/67c0a7891e6fca07454c48a0a182054dd45e87e8))





# [1.17.0](http://github.com//cap-md089/evmplus-v6/compare/common-lib@1.7.0...common-lib@1.17.0) (2020-09-27)


### Bug Fixes

* fixed event website not displaying on the eventviewer ([9aeb97b](http://github.com//cap-md089/evmplus-v6/commit/9aeb97beff013dc4808e8c481155d95f1d7cd980)), closes [#43](http://github.com//cap-md089/evmplus-v6/issues/43)
* fixed ImportCAPWATCHFile types to more accurately reflect the types of a CAPWATCH CSV file ([fffae38](http://github.com//cap-md089/evmplus-v6/commit/fffae38d6ba729c7592b1567242e4ea97cfe185e))
* fixed linking events and attendance management ([78cb150](http://github.com//cap-md089/evmplus-v6/commit/78cb150039463240ef89b493d842d185c3b3d36a))
* fixed time representation in Google calendar item description blocks ([c70773b](http://github.com//cap-md089/evmplus-v6/commit/c70773b5233aeba39d0656ae6d4eb87b423a5093)), closes [#44](http://github.com//cap-md089/evmplus-v6/issues/44)
* removed Wing calendar ([b7f6d84](http://github.com//cap-md089/evmplus-v6/commit/b7f6d84f1a9f203297111d9d2386ee5569434894)), closes [#24](http://github.com//cap-md089/evmplus-v6/issues/24)
* **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/evmplus-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))


### Features

* **signin:** added sign in logging ([c48fd90](http://github.com//cap-md089/evmplus-v6/commit/c48fd904a5b6c3f6a118ff74ebca88dc726dae41)), closes [#26](http://github.com//cap-md089/evmplus-v6/issues/26)
* added attendancescanner ([70f9feb](http://github.com//cap-md089/evmplus-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/evmplus-v6/issues/19)
* adding cadet promotion requirements display ([6659e57](http://github.com//cap-md089/evmplus-v6/commit/6659e571bcf938370ffb0954c053d24f907d24f4))
* completed adding Cadet Promotion Requirements display on Main ([f2982b1](http://github.com//cap-md089/evmplus-v6/commit/f2982b1cc97dbce6d2b31f432e91499bfd39f627)), closes [#5](http://github.com//cap-md089/evmplus-v6/issues/5)
* made PAM.RequireMemberType smarter ([fbbc6ed](http://github.com//cap-md089/evmplus-v6/commit/fbbc6eda975457e8fcee52c33d227c31e6ce5c7b))
* provided better copy event dialogues ([00901ec](http://github.com//cap-md089/evmplus-v6/commit/00901ec4028c18a5d3cabc990439d493f322b14e)), closes [#13](http://github.com//cap-md089/evmplus-v6/issues/13)
* **main.tsx:** continued work on adding cadet promotion requirements to main page ([47c96f3](http://github.com//cap-md089/evmplus-v6/commit/47c96f39f818e479c5ea774f21babec1322d9e6a))
* added MFA using an OTPA ([900239b](http://github.com//cap-md089/evmplus-v6/commit/900239b673598e22194bd0cb0edbdfef6a3d4cfa))
* **new:** continued development on cadet promotion requirements ([67c0a78](http://github.com//cap-md089/evmplus-v6/commit/67c0a7891e6fca07454c48a0a182054dd45e87e8))





# [1.16.0](http://github.com//cap-md089/evmplus-v6/compare/common-lib@1.7.0...common-lib@1.16.0) (2020-09-24)


### Bug Fixes

* fixed event website not displaying on the eventviewer ([9aeb97b](http://github.com//cap-md089/evmplus-v6/commit/9aeb97beff013dc4808e8c481155d95f1d7cd980)), closes [#43](http://github.com//cap-md089/evmplus-v6/issues/43)
* fixed ImportCAPWATCHFile types to more accurately reflect the types of a CAPWATCH CSV file ([fffae38](http://github.com//cap-md089/evmplus-v6/commit/fffae38d6ba729c7592b1567242e4ea97cfe185e))
* fixed linking events and attendance management ([78cb150](http://github.com//cap-md089/evmplus-v6/commit/78cb150039463240ef89b493d842d185c3b3d36a))
* fixed time representation in Google calendar item description blocks ([c70773b](http://github.com//cap-md089/evmplus-v6/commit/c70773b5233aeba39d0656ae6d4eb87b423a5093)), closes [#44](http://github.com//cap-md089/evmplus-v6/issues/44)
* removed Wing calendar ([b7f6d84](http://github.com//cap-md089/evmplus-v6/commit/b7f6d84f1a9f203297111d9d2386ee5569434894)), closes [#24](http://github.com//cap-md089/evmplus-v6/issues/24)
* **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/evmplus-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))


### Features

* **signin:** added sign in logging ([c48fd90](http://github.com//cap-md089/evmplus-v6/commit/c48fd904a5b6c3f6a118ff74ebca88dc726dae41)), closes [#26](http://github.com//cap-md089/evmplus-v6/issues/26)
* added attendancescanner ([70f9feb](http://github.com//cap-md089/evmplus-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/evmplus-v6/issues/19)
* adding cadet promotion requirements display ([6659e57](http://github.com//cap-md089/evmplus-v6/commit/6659e571bcf938370ffb0954c053d24f907d24f4))
* completed adding Cadet Promotion Requirements display on Main ([f2982b1](http://github.com//cap-md089/evmplus-v6/commit/f2982b1cc97dbce6d2b31f432e91499bfd39f627)), closes [#5](http://github.com//cap-md089/evmplus-v6/issues/5)
* made PAM.RequireMemberType smarter ([fbbc6ed](http://github.com//cap-md089/evmplus-v6/commit/fbbc6eda975457e8fcee52c33d227c31e6ce5c7b))
* provided better copy event dialogues ([00901ec](http://github.com//cap-md089/evmplus-v6/commit/00901ec4028c18a5d3cabc990439d493f322b14e)), closes [#13](http://github.com//cap-md089/evmplus-v6/issues/13)
* **main.tsx:** continued work on adding cadet promotion requirements to main page ([47c96f3](http://github.com//cap-md089/evmplus-v6/commit/47c96f39f818e479c5ea774f21babec1322d9e6a))
* added MFA using an OTPA ([900239b](http://github.com//cap-md089/evmplus-v6/commit/900239b673598e22194bd0cb0edbdfef6a3d4cfa))
* **new:** continued development on cadet promotion requirements ([67c0a78](http://github.com//cap-md089/evmplus-v6/commit/67c0a7891e6fca07454c48a0a182054dd45e87e8))





# [1.15.0](http://github.com//cap-md089/capunit-com-v6/compare/common-lib@1.7.0...common-lib@1.15.0) (2020-09-09)


### Bug Fixes

* removed Wing calendar ([b7f6d84](http://github.com//cap-md089/capunit-com-v6/commit/b7f6d84f1a9f203297111d9d2386ee5569434894)), closes [#24](http://github.com//cap-md089/capunit-com-v6/issues/24)
* **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/capunit-com-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))
* fixed ImportCAPWATCHFile types to more accurately reflect the types of a CAPWATCH CSV file ([fffae38](http://github.com//cap-md089/capunit-com-v6/commit/fffae38d6ba729c7592b1567242e4ea97cfe185e))


### Features

* completed adding Cadet Promotion Requirements display on Main ([f2982b1](http://github.com//cap-md089/capunit-com-v6/commit/f2982b1cc97dbce6d2b31f432e91499bfd39f627)), closes [#5](http://github.com//cap-md089/capunit-com-v6/issues/5)
* provided better copy event dialogues ([00901ec](http://github.com//cap-md089/capunit-com-v6/commit/00901ec4028c18a5d3cabc990439d493f322b14e)), closes [#13](http://github.com//cap-md089/capunit-com-v6/issues/13)
* **main.tsx:** continued work on adding cadet promotion requirements to main page ([47c96f3](http://github.com//cap-md089/capunit-com-v6/commit/47c96f39f818e479c5ea774f21babec1322d9e6a))
* added attendancescanner ([70f9feb](http://github.com//cap-md089/capunit-com-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/capunit-com-v6/issues/19)
* added MFA using an OTPA ([900239b](http://github.com//cap-md089/capunit-com-v6/commit/900239b673598e22194bd0cb0edbdfef6a3d4cfa))
* **new:** continued development on cadet promotion requirements ([67c0a78](http://github.com//cap-md089/capunit-com-v6/commit/67c0a7891e6fca07454c48a0a182054dd45e87e8))
* adding cadet promotion requirements display ([6659e57](http://github.com//cap-md089/capunit-com-v6/commit/6659e571bcf938370ffb0954c053d24f907d24f4))
* made PAM.RequireMemberType smarter ([fbbc6ed](http://github.com//cap-md089/capunit-com-v6/commit/fbbc6eda975457e8fcee52c33d227c31e6ce5c7b))





# [1.14.0](http://github.com//cap-md089/evmplus-v6/compare/common-lib@1.7.0...common-lib@1.14.0) (2020-09-07)

### Bug Fixes

-   removed Wing calendar ([b7f6d84](http://github.com//cap-md089/evmplus-v6/commit/b7f6d84f1a9f203297111d9d2386ee5569434894)), closes [#24](http://github.com//cap-md089/evmplus-v6/issues/24)
-   **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/evmplus-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))
-   fixed ImportCAPWATCHFile types to more accurately reflect the types of a CAPWATCH CSV file ([fffae38](http://github.com//cap-md089/evmplus-v6/commit/fffae38d6ba729c7592b1567242e4ea97cfe185e))

### Features

-   provided better copy event dialogues ([00901ec](http://github.com//cap-md089/evmplus-v6/commit/00901ec4028c18a5d3cabc990439d493f322b14e)), closes [#13](http://github.com//cap-md089/evmplus-v6/issues/13)
-   **main.tsx:** continued work on adding cadet promotion requirements to main page ([47c96f3](http://github.com//cap-md089/evmplus-v6/commit/47c96f39f818e479c5ea774f21babec1322d9e6a))
-   added attendancescanner ([70f9feb](http://github.com//cap-md089/evmplus-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/evmplus-v6/issues/19)
-   added MFA using an OTPA ([900239b](http://github.com//cap-md089/evmplus-v6/commit/900239b673598e22194bd0cb0edbdfef6a3d4cfa))
-   **new:** continued development on cadet promotion requirements ([67c0a78](http://github.com//cap-md089/evmplus-v6/commit/67c0a7891e6fca07454c48a0a182054dd45e87e8))
-   adding cadet promotion requirements display ([6659e57](http://github.com//cap-md089/evmplus-v6/commit/6659e571bcf938370ffb0954c053d24f907d24f4))
-   made PAM.RequireMemberType smarter ([fbbc6ed](http://github.com//cap-md089/evmplus-v6/commit/fbbc6eda975457e8fcee52c33d227c31e6ce5c7b))

# [1.13.0](http://github.com//cap-md089/evmplus-v6/compare/common-lib@1.7.0...common-lib@1.13.0) (2020-09-07)

### Bug Fixes

-   removed Wing calendar ([b7f6d84](http://github.com//cap-md089/evmplus-v6/commit/b7f6d84f1a9f203297111d9d2386ee5569434894)), closes [#24](http://github.com//cap-md089/evmplus-v6/issues/24)
-   **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/evmplus-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))
-   fixed ImportCAPWATCHFile types to more accurately reflect the types of a CAPWATCH CSV file ([fffae38](http://github.com//cap-md089/evmplus-v6/commit/fffae38d6ba729c7592b1567242e4ea97cfe185e))

### Features

-   provided better copy event dialogues ([00901ec](http://github.com//cap-md089/evmplus-v6/commit/00901ec4028c18a5d3cabc990439d493f322b14e)), closes [#13](http://github.com//cap-md089/evmplus-v6/issues/13)
-   **main.tsx:** continued work on adding cadet promotion requirements to main page ([47c96f3](http://github.com//cap-md089/evmplus-v6/commit/47c96f39f818e479c5ea774f21babec1322d9e6a))
-   added attendancescanner ([70f9feb](http://github.com//cap-md089/evmplus-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/evmplus-v6/issues/19)
-   added MFA using an OTPA ([900239b](http://github.com//cap-md089/evmplus-v6/commit/900239b673598e22194bd0cb0edbdfef6a3d4cfa))
-   **new:** continued development on cadet promotion requirements ([67c0a78](http://github.com//cap-md089/evmplus-v6/commit/67c0a7891e6fca07454c48a0a182054dd45e87e8))
-   adding cadet promotion requirements display ([6659e57](http://github.com//cap-md089/evmplus-v6/commit/6659e571bcf938370ffb0954c053d24f907d24f4))
-   made PAM.RequireMemberType smarter ([fbbc6ed](http://github.com//cap-md089/evmplus-v6/commit/fbbc6eda975457e8fcee52c33d227c31e6ce5c7b))

# [1.12.0](http://github.com//cap-md089/evmplus-v6/compare/common-lib@1.7.0...common-lib@1.12.0) (2020-09-06)

### Bug Fixes

-   removed Wing calendar ([b7f6d84](http://github.com//cap-md089/evmplus-v6/commit/b7f6d84f1a9f203297111d9d2386ee5569434894)), closes [#24](http://github.com//cap-md089/evmplus-v6/issues/24)
-   **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/evmplus-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))
-   fixed ImportCAPWATCHFile types to more accurately reflect the types of a CAPWATCH CSV file ([fffae38](http://github.com//cap-md089/evmplus-v6/commit/fffae38d6ba729c7592b1567242e4ea97cfe185e))

### Features

-   added attendancescanner ([70f9feb](http://github.com//cap-md089/evmplus-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/evmplus-v6/issues/19)
-   added MFA using an OTPA ([900239b](http://github.com//cap-md089/evmplus-v6/commit/900239b673598e22194bd0cb0edbdfef6a3d4cfa))
-   made PAM.RequireMemberType smarter ([fbbc6ed](http://github.com//cap-md089/evmplus-v6/commit/fbbc6eda975457e8fcee52c33d227c31e6ce5c7b))
-   provided better copy event dialogues ([00901ec](http://github.com//cap-md089/evmplus-v6/commit/00901ec4028c18a5d3cabc990439d493f322b14e)), closes [#13](http://github.com//cap-md089/evmplus-v6/issues/13)

# [1.11.0](http://github.com//cap-md089/evmplus-v6/compare/common-lib@1.7.0...common-lib@1.11.0) (2020-09-02)

### Bug Fixes

-   fixed CAPWATCH import not deleting records properly ([dce238b](http://github.com//cap-md089/evmplus-v6/commit/dce238b0f92959a372e15551fbf66dc1e5c30374))
-   **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/evmplus-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))
-   fixed ImportCAPWATCHFile types to more accurately reflect the types of a CAPWATCH CSV file ([fffae38](http://github.com//cap-md089/evmplus-v6/commit/fffae38d6ba729c7592b1567242e4ea97cfe185e))

### Features

-   added ability to have Discord bot message a role ([047c7ae](http://github.com//cap-md089/evmplus-v6/commit/047c7ae876e2cac7e52b4466e013a7e1d1a70c9a))
-   added attendancescanner ([70f9feb](http://github.com//cap-md089/evmplus-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/evmplus-v6/issues/19)
-   made PAM.RequireMemberType smarter ([fbbc6ed](http://github.com//cap-md089/evmplus-v6/commit/fbbc6eda975457e8fcee52c33d227c31e6ce5c7b))

# [1.10.0](http://github.com//cap-md089/evmplus-v6/compare/common-lib@1.7.0...common-lib@1.10.0) (2020-09-01)

### Bug Fixes

-   fixed CAPWATCH import not deleting records properly ([dce238b](http://github.com//cap-md089/evmplus-v6/commit/dce238b0f92959a372e15551fbf66dc1e5c30374))
-   **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/evmplus-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))
-   fixed ImportCAPWATCHFile types to more accurately reflect the types of a CAPWATCH CSV file ([fffae38](http://github.com//cap-md089/evmplus-v6/commit/fffae38d6ba729c7592b1567242e4ea97cfe185e))

### Features

-   added ability to have Discord bot message a role ([047c7ae](http://github.com//cap-md089/evmplus-v6/commit/047c7ae876e2cac7e52b4466e013a7e1d1a70c9a))
-   added attendancescanner ([70f9feb](http://github.com//cap-md089/evmplus-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/evmplus-v6/issues/19)
-   made PAM.RequireMemberType smarter ([fbbc6ed](http://github.com//cap-md089/evmplus-v6/commit/fbbc6eda975457e8fcee52c33d227c31e6ce5c7b))

# [1.9.0](http://github.com//cap-md089/evmplus-v6/compare/common-lib@1.7.0...common-lib@1.9.0) (2020-08-31)

### Bug Fixes

-   **sessions:** fixed session timeout not updating ([253e86d](http://github.com//cap-md089/evmplus-v6/commit/253e86d07422be45b9fb03a286ed067cece28eac))
-   fixed ImportCAPWATCHFile types to more accurately reflect the types of a CAPWATCH CSV file ([fffae38](http://github.com//cap-md089/evmplus-v6/commit/fffae38d6ba729c7592b1567242e4ea97cfe185e))

### Features

-   added attendancescanner ([70f9feb](http://github.com//cap-md089/evmplus-v6/commit/70f9feba454f823fb9d33a43e404eafa18fe64ab)), closes [#19](http://github.com//cap-md089/evmplus-v6/issues/19)
-   made PAM.RequireMemberType smarter ([fbbc6ed](http://github.com//cap-md089/evmplus-v6/commit/fbbc6eda975457e8fcee52c33d227c31e6ce5c7b))

# [1.8.0](http://github.com//cap-md089/evmplus-v6/compare/common-lib@1.7.0...common-lib@1.8.0) (2020-08-25)

### Features

-   made PAM.RequireMemberType smarter ([fbbc6ed](http://github.com//cap-md089/evmplus-v6/commit/fbbc6eda975457e8fcee52c33d227c31e6ce5c7b))

# [1.7.0](http://github.com//cap-md089/evmplus-v6/compare/common-lib@1.6.0...common-lib@1.7.0) (2020-08-17)

### Bug Fixes

-   removed wing calendar from wing and region accounts and their events ([8975b7c](http://github.com//cap-md089/evmplus-v6/commit/8975b7c69efa955f87433244cef7f6460bdc6ae1)), closes [#6](http://github.com//cap-md089/evmplus-v6/issues/6)
-   **discord-bot:** fixed not being able to update flight membership ([6c836ad](http://github.com//cap-md089/evmplus-v6/commit/6c836ad9e0d98ab99d8af5bd855972fdcb644c12))

### Features

-   **prospectivemembers:** added a prospective member management page ([73b07b3](http://github.com//cap-md089/evmplus-v6/commit/73b07b3b9077ba52e82849a97463225c4a68154d)), closes [#4](http://github.com//cap-md089/evmplus-v6/issues/4)

## [1.6.1](http://github.com//cap-md089/evmplus-v6/compare/common-lib@1.6.0...common-lib@1.6.1) (2020-08-13)

### Bug Fixes

-   **discord-bot:** fixed not being able to update flight membership ([6c836ad](http://github.com//cap-md089/evmplus-v6/commit/6c836ad9e0d98ab99d8af5bd855972fdcb644c12))

# 1.6.0 (2020-08-11)

### Bug Fixes

-   updated TypeScript for all packages to 3.9 ([12ee6e6](http://github.com//cap-md089/evmplus-v6/commit/12ee6e67d9669d73d849791cf22637357dd4ae30))
-   **capprospective.ts:** fixed URL clash with create CAP NHQ account ([da28394](http://github.com//cap-md089/evmplus-v6/commit/da28394482041e326a014e67e2b63be72c5834b0))
-   **events:** fixed security bug with permissions ([82aa23f](http://github.com//cap-md089/evmplus-v6/commit/82aa23f467f39c578c685ec0c9ffb96a998375de))
-   **eventviewer:** fixed team leaders not being able to sign up to events limited to their team ([ea9ae4a](http://github.com//cap-md089/evmplus-v6/commit/ea9ae4a520e386f010b1e620a706c1762052c7c4))
-   **prospectivemembers:** fixed creation of prospective members ([042b39a](http://github.com//cap-md089/evmplus-v6/commit/042b39af12ad8022ec391c0e8562a83d5211f53b))
-   **typings:** fixed type declarations not being committed ([0ff0ec9](http://github.com//cap-md089/evmplus-v6/commit/0ff0ec93432111ed8d42a4e0ec3ab130eae42e4f))
-   added requirement of a validator for creating a prospective member ([0043a6b](http://github.com//cap-md089/evmplus-v6/commit/0043a6b1e43cad863193c5b3457d0b4eb00a0a81))
-   Fixed link event not showing up ([143df6f](http://github.com//cap-md089/evmplus-v6/commit/143df6f6daaf7975fff3e58c68c888a226d8b31a))

### Features

-   **discord-bot:** made discord bot truly optional ([bb8a1f8](http://github.com//cap-md089/evmplus-v6/commit/bb8a1f8e6a5d5b1156141fc1ac5925711fe94bcd))
-   **eventviewer:** eventViewer now shows all events that are linked to the event being viewed ([979dc77](http://github.com//cap-md089/evmplus-v6/commit/979dc771ed2b4ce4c652536ea589c0c1de64d3ac))

# [1.5.0](http://github.com//cap-md089/evmplus-v6/compare/common-lib@1.4.1...common-lib@1.5.0) (2020-08-11)

### Bug Fixes

-   updated TypeScript for all packages to 3.9 ([12ee6e6](http://github.com//cap-md089/evmplus-v6/commit/12ee6e67d9669d73d849791cf22637357dd4ae30))
-   **typings:** fixed type declarations not being committed ([0ff0ec9](http://github.com//cap-md089/evmplus-v6/commit/0ff0ec93432111ed8d42a4e0ec3ab130eae42e4f))

### Features

-   **discord-bot:** made discord bot truly optional ([bb8a1f8](http://github.com//cap-md089/evmplus-v6/commit/bb8a1f8e6a5d5b1156141fc1ac5925711fe94bcd))
