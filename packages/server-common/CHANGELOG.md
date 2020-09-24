# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
