# Changelog

## 1.0.0 (2026-03-24)


### ✨ Features

* add appointment ([#100](https://github.com/ESP-Corevia/CoreApp/issues/100)) ([1ca8a15](https://github.com/ESP-Corevia/CoreApp/commit/1ca8a1599f3dd4c46087a42415a6e2689f7072c8))
* add dashboard admin ([#27](https://github.com/ESP-Corevia/CoreApp/issues/27)) ([6065df3](https://github.com/ESP-Corevia/CoreApp/commit/6065df3bd52912ba8717a3c82a21d80799443dc3))
* add doctors management functionality ([#81](https://github.com/ESP-Corevia/CoreApp/issues/81)) ([f167234](https://github.com/ESP-Corevia/CoreApp/commit/f167234678aaab2bde42fb7fee63377127a75c18))
* add GitHub workflows for labeling released PRs and updating release configuration ([1b866f9](https://github.com/ESP-Corevia/CoreApp/commit/1b866f9ffb2c0c21ee72c6d882579af4daaa0803))
* add medications database schema and API client ([#105](https://github.com/ESP-Corevia/CoreApp/issues/105)) ([32c8b5a](https://github.com/ESP-Corevia/CoreApp/commit/32c8b5a6c4b78afe9c874da517a9e283a2eca901))
* add migration test in ci and renovate ([#60](https://github.com/ESP-Corevia/CoreApp/issues/60)) ([48d370f](https://github.com/ESP-Corevia/CoreApp/commit/48d370f3249c2fbb7cb74d402f6d51a67f8281de))
* **admin:** add sessions management ([#34](https://github.com/ESP-Corevia/CoreApp/issues/34)) ([5e71a48](https://github.com/ESP-Corevia/CoreApp/commit/5e71a48f98eb147352821b7f45f6e19b9155959a))
* **apps:** update trpc and react version and add catalog to yarn v4.12 ([#42](https://github.com/ESP-Corevia/CoreApp/issues/42)) ([91c1dde](https://github.com/ESP-Corevia/CoreApp/commit/91c1dde52282da5455d3243495670335330523e8))
* Docker and Kubernetes configuration ([#6](https://github.com/ESP-Corevia/CoreApp/issues/6)) ([7d3376b](https://github.com/ESP-Corevia/CoreApp/commit/7d3376bf69b756a4856836399d56b55f0a161200))
* implement availability service and repository for doctor appointment slots ([#84](https://github.com/ESP-Corevia/CoreApp/issues/84)) ([e96b614](https://github.com/ESP-Corevia/CoreApp/commit/e96b614b5f90ab53eea867a2881577cbd4136476))
* init front ([#4](https://github.com/ESP-Corevia/CoreApp/issues/4)) ([f0340a3](https://github.com/ESP-Corevia/CoreApp/commit/f0340a315ecee79f135355027f2af46a658897f7))
* **server:** add banner ([#9](https://github.com/ESP-Corevia/CoreApp/issues/9)) ([908d19a](https://github.com/ESP-Corevia/CoreApp/commit/908d19a482a0a8601db3bc97b25f81241c5a0d3b))
* **server:** add vitest init ([#13](https://github.com/ESP-Corevia/CoreApp/issues/13)) ([ea1c621](https://github.com/ESP-Corevia/CoreApp/commit/ea1c621b52282df5bccf71bcc842f8bd0664f008))
* **server:** init repo and services for CRUD users ([#17](https://github.com/ESP-Corevia/CoreApp/issues/17)) ([d7e5db5](https://github.com/ESP-Corevia/CoreApp/commit/d7e5db538d5afc5dba2fc7d64511f48229aa7795))
* update CORS configuration and add bearer token plugin for authentication ([#92](https://github.com/ESP-Corevia/CoreApp/issues/92)) ([1e8b1e9](https://github.com/ESP-Corevia/CoreApp/commit/1e8b1e9cc0e689a5d11142e372e3e06cc2e64a50))
* update user roles to include 'patient' and adjust related components ([#98](https://github.com/ESP-Corevia/CoreApp/issues/98)) ([4efb121](https://github.com/ESP-Corevia/CoreApp/commit/4efb12153523e2ce4cd5be70724c3757cf79321c))
* upgrade Node.js to 24.13.1 and add home deployment workflow ([#79](https://github.com/ESP-Corevia/CoreApp/issues/79)) ([a1a12ab](https://github.com/ESP-Corevia/CoreApp/commit/a1a12abfc31740f4974bae4ab30283ac2880de69))
* **web:** add tools dev & ci ([#19](https://github.com/ESP-Corevia/CoreApp/issues/19)) ([3d4138b](https://github.com/ESP-Corevia/CoreApp/commit/3d4138b09c7476746edde19997a0764a18ed75b2))
* **web:** add user profile with settings page ([#25](https://github.com/ESP-Corevia/CoreApp/issues/25)) ([2ef6242](https://github.com/ESP-Corevia/CoreApp/commit/2ef6242c3b8ad3528ead470d56cc1ca70ca04278))


### 🐛 Fixes

* enhance trusted origins in authentication to include localhost ([7d3376b](https://github.com/ESP-Corevia/CoreApp/commit/7d3376bf69b756a4856836399d56b55f0a161200))
* **server:** add merge OpenApiSchema ([#2](https://github.com/ESP-Corevia/CoreApp/issues/2)) ([cd9f161](https://github.com/ESP-Corevia/CoreApp/commit/cd9f16164b6b43ba10b663fca2ecd236b366ea65))
* **server:** fix the import of pg ([#51](https://github.com/ESP-Corevia/CoreApp/issues/51)) ([e89f0d0](https://github.com/ESP-Corevia/CoreApp/commit/e89f0d03db6ff75ef6ed96dcd9842defff4bdbf5))
* **tsdown:** add outExtensions function to specify output file extensions ([#53](https://github.com/ESP-Corevia/CoreApp/issues/53)) ([367d875](https://github.com/ESP-Corevia/CoreApp/commit/367d875d6a7938599409cb3b30c028ecf951a644))


### 🧹 Refactors

* delete fields lastName and firstName ([#73](https://github.com/ESP-Corevia/CoreApp/issues/73)) ([e55fb26](https://github.com/ESP-Corevia/CoreApp/commit/e55fb26deccf42fb43260c3484bedc3c562fb3dc))


### 🔧 Chores

* add .dockerignore files for server and web applications ([7d3376b](https://github.com/ESP-Corevia/CoreApp/commit/7d3376bf69b756a4856836399d56b55f0a161200))
* create docker-compose.yml for managing multi-container application setup ([7d3376b](https://github.com/ESP-Corevia/CoreApp/commit/7d3376bf69b756a4856836399d56b55f0a161200))
* **deps:** update dependency better-auth to v1.5.5 ([#96](https://github.com/ESP-Corevia/CoreApp/issues/96)) ([fec36ec](https://github.com/ESP-Corevia/CoreApp/commit/fec36ecc7c37efba1f3b15577163a2fd9471c451))
* **deps:** update tanstack ([#95](https://github.com/ESP-Corevia/CoreApp/issues/95)) ([8275268](https://github.com/ESP-Corevia/CoreApp/commit/82752689b7d03a452b8297cf94051fc08980e159))
* migrate from yarn to pnpm ([#102](https://github.com/ESP-Corevia/CoreApp/issues/102)) ([2bcad9a](https://github.com/ESP-Corevia/CoreApp/commit/2bcad9a48d517bba661c618d239c0e745bf15d0d))
* refactor Dockerfile for web app to improve build process and dependencies ([7d3376b](https://github.com/ESP-Corevia/CoreApp/commit/7d3376bf69b756a4856836399d56b55f0a161200))
* release master ([#104](https://github.com/ESP-Corevia/CoreApp/issues/104)) ([29f6a40](https://github.com/ESP-Corevia/CoreApp/commit/29f6a4063f300dd94435e575f015af25e572aa1a))
* release master ([#46](https://github.com/ESP-Corevia/CoreApp/issues/46)) ([98400bf](https://github.com/ESP-Corevia/CoreApp/commit/98400bf26265769e5e1c1f35dba6117d270a6399))
* release master ([#47](https://github.com/ESP-Corevia/CoreApp/issues/47)) ([780f0ed](https://github.com/ESP-Corevia/CoreApp/commit/780f0edf3db7ea564a8eaa1d89b6ccd34724a2c0))
* release master ([#49](https://github.com/ESP-Corevia/CoreApp/issues/49)) ([3b2ae3c](https://github.com/ESP-Corevia/CoreApp/commit/3b2ae3c8c40f43157f19da3af5272edadbf3a827))
* release master ([#52](https://github.com/ESP-Corevia/CoreApp/issues/52)) ([f0eb134](https://github.com/ESP-Corevia/CoreApp/commit/f0eb134a537d9ef2fba4eca93f25ed1feec835b0))
* release master ([#54](https://github.com/ESP-Corevia/CoreApp/issues/54)) ([7bb4f79](https://github.com/ESP-Corevia/CoreApp/commit/7bb4f7905f4817d5c9f16decc631c6810e21ea53))
* release master ([#58](https://github.com/ESP-Corevia/CoreApp/issues/58)) ([1e91e28](https://github.com/ESP-Corevia/CoreApp/commit/1e91e28b16b7ae784b31828eddcbff065273fe2b))
* release master ([#59](https://github.com/ESP-Corevia/CoreApp/issues/59)) ([22cc2f9](https://github.com/ESP-Corevia/CoreApp/commit/22cc2f98b5aa64ada1b731535db4bea28dbd4397))
* release master ([#61](https://github.com/ESP-Corevia/CoreApp/issues/61)) ([043bb28](https://github.com/ESP-Corevia/CoreApp/commit/043bb28532427a067812c7e3905de45ba05a797b))
* release master ([#74](https://github.com/ESP-Corevia/CoreApp/issues/74)) ([45459a1](https://github.com/ESP-Corevia/CoreApp/commit/45459a15b471238fd92663ed87507d82526fb15f))
* release master ([#93](https://github.com/ESP-Corevia/CoreApp/issues/93)) ([c7c3512](https://github.com/ESP-Corevia/CoreApp/commit/c7c3512ee32f8130b101ec9cf89382742a3093e9))
* release master ([#99](https://github.com/ESP-Corevia/CoreApp/issues/99)) ([009f964](https://github.com/ESP-Corevia/CoreApp/commit/009f9640979af0c24a9553ac6808f14e639fc2d1))
* switch to biomejs ([#103](https://github.com/ESP-Corevia/CoreApp/issues/103)) ([54a8089](https://github.com/ESP-Corevia/CoreApp/commit/54a8089c3a6650d108b5bb78b9256c988952f86e))
* update package.json dependencies for web app to latest versions ([7d3376b](https://github.com/ESP-Corevia/CoreApp/commit/7d3376bf69b756a4856836399d56b55f0a161200))
* update yarn.lock with new dependency versions and remove unused ones ([7d3376b](https://github.com/ESP-Corevia/CoreApp/commit/7d3376bf69b756a4856836399d56b55f0a161200))

## [1.6.0](https://github.com/ESP-Corevia/CoreApp/compare/server-v1.5.0...server-v1.6.0) (2026-03-23)


### ✨ Features

* add appointment ([#100](https://github.com/ESP-Corevia/CoreApp/issues/100)) ([1ca8a15](https://github.com/ESP-Corevia/CoreApp/commit/1ca8a1599f3dd4c46087a42415a6e2689f7072c8))
* add dashboard admin ([#27](https://github.com/ESP-Corevia/CoreApp/issues/27)) ([6065df3](https://github.com/ESP-Corevia/CoreApp/commit/6065df3bd52912ba8717a3c82a21d80799443dc3))
* add doctors management functionality ([#81](https://github.com/ESP-Corevia/CoreApp/issues/81)) ([f167234](https://github.com/ESP-Corevia/CoreApp/commit/f167234678aaab2bde42fb7fee63377127a75c18))
* add migration test in ci and renovate ([#60](https://github.com/ESP-Corevia/CoreApp/issues/60)) ([48d370f](https://github.com/ESP-Corevia/CoreApp/commit/48d370f3249c2fbb7cb74d402f6d51a67f8281de))
* **admin:** add sessions management ([#34](https://github.com/ESP-Corevia/CoreApp/issues/34)) ([5e71a48](https://github.com/ESP-Corevia/CoreApp/commit/5e71a48f98eb147352821b7f45f6e19b9155959a))
* **apps:** update trpc and react version and add catalog to yarn v4.12 ([#42](https://github.com/ESP-Corevia/CoreApp/issues/42)) ([91c1dde](https://github.com/ESP-Corevia/CoreApp/commit/91c1dde52282da5455d3243495670335330523e8))
* Docker and Kubernetes configuration ([#6](https://github.com/ESP-Corevia/CoreApp/issues/6)) ([7d3376b](https://github.com/ESP-Corevia/CoreApp/commit/7d3376bf69b756a4856836399d56b55f0a161200))
* implement availability service and repository for doctor appointment slots ([#84](https://github.com/ESP-Corevia/CoreApp/issues/84)) ([e96b614](https://github.com/ESP-Corevia/CoreApp/commit/e96b614b5f90ab53eea867a2881577cbd4136476))
* init front ([#4](https://github.com/ESP-Corevia/CoreApp/issues/4)) ([f0340a3](https://github.com/ESP-Corevia/CoreApp/commit/f0340a315ecee79f135355027f2af46a658897f7))
* **server:** add banner ([#9](https://github.com/ESP-Corevia/CoreApp/issues/9)) ([908d19a](https://github.com/ESP-Corevia/CoreApp/commit/908d19a482a0a8601db3bc97b25f81241c5a0d3b))
* **server:** add vitest init ([#13](https://github.com/ESP-Corevia/CoreApp/issues/13)) ([ea1c621](https://github.com/ESP-Corevia/CoreApp/commit/ea1c621b52282df5bccf71bcc842f8bd0664f008))
* **server:** init repo and services for CRUD users ([#17](https://github.com/ESP-Corevia/CoreApp/issues/17)) ([d7e5db5](https://github.com/ESP-Corevia/CoreApp/commit/d7e5db538d5afc5dba2fc7d64511f48229aa7795))
* update CORS configuration and add bearer token plugin for authentication ([#92](https://github.com/ESP-Corevia/CoreApp/issues/92)) ([1e8b1e9](https://github.com/ESP-Corevia/CoreApp/commit/1e8b1e9cc0e689a5d11142e372e3e06cc2e64a50))
* update user roles to include 'patient' and adjust related components ([#98](https://github.com/ESP-Corevia/CoreApp/issues/98)) ([4efb121](https://github.com/ESP-Corevia/CoreApp/commit/4efb12153523e2ce4cd5be70724c3757cf79321c))
* upgrade Node.js to 24.13.1 and add home deployment workflow ([#79](https://github.com/ESP-Corevia/CoreApp/issues/79)) ([a1a12ab](https://github.com/ESP-Corevia/CoreApp/commit/a1a12abfc31740f4974bae4ab30283ac2880de69))
* **web:** add tools dev & ci ([#19](https://github.com/ESP-Corevia/CoreApp/issues/19)) ([3d4138b](https://github.com/ESP-Corevia/CoreApp/commit/3d4138b09c7476746edde19997a0764a18ed75b2))
* **web:** add user profile with settings page ([#25](https://github.com/ESP-Corevia/CoreApp/issues/25)) ([2ef6242](https://github.com/ESP-Corevia/CoreApp/commit/2ef6242c3b8ad3528ead470d56cc1ca70ca04278))


### 🐛 Fixes

* enhance trusted origins in authentication to include localhost ([7d3376b](https://github.com/ESP-Corevia/CoreApp/commit/7d3376bf69b756a4856836399d56b55f0a161200))
* **server:** add merge OpenApiSchema ([#2](https://github.com/ESP-Corevia/CoreApp/issues/2)) ([cd9f161](https://github.com/ESP-Corevia/CoreApp/commit/cd9f16164b6b43ba10b663fca2ecd236b366ea65))
* **server:** fix the import of pg ([#51](https://github.com/ESP-Corevia/CoreApp/issues/51)) ([e89f0d0](https://github.com/ESP-Corevia/CoreApp/commit/e89f0d03db6ff75ef6ed96dcd9842defff4bdbf5))
* **tsdown:** add outExtensions function to specify output file extensions ([#53](https://github.com/ESP-Corevia/CoreApp/issues/53)) ([367d875](https://github.com/ESP-Corevia/CoreApp/commit/367d875d6a7938599409cb3b30c028ecf951a644))


### 🧹 Refactors

* delete fields lastName and firstName ([#73](https://github.com/ESP-Corevia/CoreApp/issues/73)) ([e55fb26](https://github.com/ESP-Corevia/CoreApp/commit/e55fb26deccf42fb43260c3484bedc3c562fb3dc))


### 🔧 Chores

* add .dockerignore files for server and web applications ([7d3376b](https://github.com/ESP-Corevia/CoreApp/commit/7d3376bf69b756a4856836399d56b55f0a161200))
* create docker-compose.yml for managing multi-container application setup ([7d3376b](https://github.com/ESP-Corevia/CoreApp/commit/7d3376bf69b756a4856836399d56b55f0a161200))
* **deps:** update dependency better-auth to v1.5.5 ([#96](https://github.com/ESP-Corevia/CoreApp/issues/96)) ([fec36ec](https://github.com/ESP-Corevia/CoreApp/commit/fec36ecc7c37efba1f3b15577163a2fd9471c451))
* **deps:** update tanstack ([#95](https://github.com/ESP-Corevia/CoreApp/issues/95)) ([8275268](https://github.com/ESP-Corevia/CoreApp/commit/82752689b7d03a452b8297cf94051fc08980e159))
* migrate from yarn to pnpm ([#102](https://github.com/ESP-Corevia/CoreApp/issues/102)) ([2bcad9a](https://github.com/ESP-Corevia/CoreApp/commit/2bcad9a48d517bba661c618d239c0e745bf15d0d))
* refactor Dockerfile for web app to improve build process and dependencies ([7d3376b](https://github.com/ESP-Corevia/CoreApp/commit/7d3376bf69b756a4856836399d56b55f0a161200))
* release master ([#46](https://github.com/ESP-Corevia/CoreApp/issues/46)) ([98400bf](https://github.com/ESP-Corevia/CoreApp/commit/98400bf26265769e5e1c1f35dba6117d270a6399))
* release master ([#47](https://github.com/ESP-Corevia/CoreApp/issues/47)) ([780f0ed](https://github.com/ESP-Corevia/CoreApp/commit/780f0edf3db7ea564a8eaa1d89b6ccd34724a2c0))
* release master ([#49](https://github.com/ESP-Corevia/CoreApp/issues/49)) ([3b2ae3c](https://github.com/ESP-Corevia/CoreApp/commit/3b2ae3c8c40f43157f19da3af5272edadbf3a827))
* release master ([#52](https://github.com/ESP-Corevia/CoreApp/issues/52)) ([f0eb134](https://github.com/ESP-Corevia/CoreApp/commit/f0eb134a537d9ef2fba4eca93f25ed1feec835b0))
* release master ([#54](https://github.com/ESP-Corevia/CoreApp/issues/54)) ([7bb4f79](https://github.com/ESP-Corevia/CoreApp/commit/7bb4f7905f4817d5c9f16decc631c6810e21ea53))
* release master ([#58](https://github.com/ESP-Corevia/CoreApp/issues/58)) ([1e91e28](https://github.com/ESP-Corevia/CoreApp/commit/1e91e28b16b7ae784b31828eddcbff065273fe2b))
* release master ([#59](https://github.com/ESP-Corevia/CoreApp/issues/59)) ([22cc2f9](https://github.com/ESP-Corevia/CoreApp/commit/22cc2f98b5aa64ada1b731535db4bea28dbd4397))
* release master ([#61](https://github.com/ESP-Corevia/CoreApp/issues/61)) ([043bb28](https://github.com/ESP-Corevia/CoreApp/commit/043bb28532427a067812c7e3905de45ba05a797b))
* release master ([#74](https://github.com/ESP-Corevia/CoreApp/issues/74)) ([45459a1](https://github.com/ESP-Corevia/CoreApp/commit/45459a15b471238fd92663ed87507d82526fb15f))
* release master ([#93](https://github.com/ESP-Corevia/CoreApp/issues/93)) ([c7c3512](https://github.com/ESP-Corevia/CoreApp/commit/c7c3512ee32f8130b101ec9cf89382742a3093e9))
* release master ([#99](https://github.com/ESP-Corevia/CoreApp/issues/99)) ([009f964](https://github.com/ESP-Corevia/CoreApp/commit/009f9640979af0c24a9553ac6808f14e639fc2d1))
* switch to biomejs ([#103](https://github.com/ESP-Corevia/CoreApp/issues/103)) ([54a8089](https://github.com/ESP-Corevia/CoreApp/commit/54a8089c3a6650d108b5bb78b9256c988952f86e))
* update package.json dependencies for web app to latest versions ([7d3376b](https://github.com/ESP-Corevia/CoreApp/commit/7d3376bf69b756a4856836399d56b55f0a161200))
* update yarn.lock with new dependency versions and remove unused ones ([7d3376b](https://github.com/ESP-Corevia/CoreApp/commit/7d3376bf69b756a4856836399d56b55f0a161200))

## [1.5.0](https://github.com/ESP-Corevia/CoreApp/compare/server-v1.4.0...server-v1.5.0) (2026-03-12)

### ✨ Features

- update user roles to include 'patient' and adjust related components ([#98](https://github.com/ESP-Corevia/CoreApp/issues/98)) ([a5a653a](https://github.com/ESP-Corevia/CoreApp/commit/a5a653a90a6e1f12030d188100beaca44087b60b))

### 🔧 Chores

- **deps:** update dependency better-auth to v1.5.5 ([#96](https://github.com/ESP-Corevia/CoreApp/issues/96)) ([f31dcda](https://github.com/ESP-Corevia/CoreApp/commit/f31dcdac3530573ff24bca546a099d83f34bbd95))
- **deps:** update tanstack ([#95](https://github.com/ESP-Corevia/CoreApp/issues/95)) ([bf89dbe](https://github.com/ESP-Corevia/CoreApp/commit/bf89dbef8e4c7fe3c05e19197fd5e431f75a7478))

## [1.4.0](https://github.com/ESP-Corevia/CoreApp/compare/server-v1.3.1...server-v1.4.0) (2026-03-11)

### ✨ Features

- add dashboard admin ([#27](https://github.com/ESP-Corevia/CoreApp/issues/27)) ([86e8584](https://github.com/ESP-Corevia/CoreApp/commit/86e85846649be74d83cb9ed089a857e72e58142c))
- add doctors management functionality ([#81](https://github.com/ESP-Corevia/CoreApp/issues/81)) ([b4a358b](https://github.com/ESP-Corevia/CoreApp/commit/b4a358bb4f7afec270f48e99f2e73f729176a6e3))
- add migration test in ci and renovate ([#60](https://github.com/ESP-Corevia/CoreApp/issues/60)) ([4645de8](https://github.com/ESP-Corevia/CoreApp/commit/4645de8caa7f1eff2777249c614092873c79bc7d))
- **admin:** add sessions management ([#34](https://github.com/ESP-Corevia/CoreApp/issues/34)) ([bd706cc](https://github.com/ESP-Corevia/CoreApp/commit/bd706cc38fbbd38abc8c640c2b5aaee71fe1d05a))
- **apps:** update trpc and react version and add catalog to yarn v4.12 ([#42](https://github.com/ESP-Corevia/CoreApp/issues/42)) ([375d2e3](https://github.com/ESP-Corevia/CoreApp/commit/375d2e39973d985cef8f01856452019a82e0e054))
- Docker and Kubernetes configuration ([#6](https://github.com/ESP-Corevia/CoreApp/issues/6)) ([f9a7579](https://github.com/ESP-Corevia/CoreApp/commit/f9a7579d1f16aa4481625e58b6505355435b5818))
- implement availability service and repository for doctor appointment slots ([#84](https://github.com/ESP-Corevia/CoreApp/issues/84)) ([a96b7da](https://github.com/ESP-Corevia/CoreApp/commit/a96b7da258ae2540b95aa7016d986cb9f351392b))
- init front ([#4](https://github.com/ESP-Corevia/CoreApp/issues/4)) ([a84184c](https://github.com/ESP-Corevia/CoreApp/commit/a84184c19a556f1a61caa2d54e4322039d577a31))
- **server:** add banner ([#9](https://github.com/ESP-Corevia/CoreApp/issues/9)) ([e5d62c6](https://github.com/ESP-Corevia/CoreApp/commit/e5d62c695629c05962e400e93d0ed317f30f489f))
- **server:** add vitest init ([#13](https://github.com/ESP-Corevia/CoreApp/issues/13)) ([aa9fd02](https://github.com/ESP-Corevia/CoreApp/commit/aa9fd02e0c79265da58bee7a2cb3f14a6d8b8787))
- **server:** init repo and services for CRUD users ([#17](https://github.com/ESP-Corevia/CoreApp/issues/17)) ([e20ae10](https://github.com/ESP-Corevia/CoreApp/commit/e20ae106ff1baa5c981f99a7cba3d63d176ac40c))
- update CORS configuration and add bearer token plugin for authentication ([#92](https://github.com/ESP-Corevia/CoreApp/issues/92)) ([43a22b4](https://github.com/ESP-Corevia/CoreApp/commit/43a22b4124daeef83b885450efaccaa6d28a93da))
- upgrade Node.js to 24.13.1 and add home deployment workflow ([#79](https://github.com/ESP-Corevia/CoreApp/issues/79)) ([ca5557d](https://github.com/ESP-Corevia/CoreApp/commit/ca5557de54384bd7b5ac2ce50cba946f9474fe61))
- **web:** add tools dev & ci ([#19](https://github.com/ESP-Corevia/CoreApp/issues/19)) ([ea3a0da](https://github.com/ESP-Corevia/CoreApp/commit/ea3a0da0e43292a3fe3af4cd43c171da99994784))
- **web:** add user profile with settings page ([#25](https://github.com/ESP-Corevia/CoreApp/issues/25)) ([ea27c65](https://github.com/ESP-Corevia/CoreApp/commit/ea27c650c708a9e518c90d53f6d9c0620d101b74))

### 🐛 Fixes

- enhance trusted origins in authentication to include localhost ([f9a7579](https://github.com/ESP-Corevia/CoreApp/commit/f9a7579d1f16aa4481625e58b6505355435b5818))
- **server:** add merge OpenApiSchema ([#2](https://github.com/ESP-Corevia/CoreApp/issues/2)) ([b35ccbd](https://github.com/ESP-Corevia/CoreApp/commit/b35ccbd6fc81c90a57535bd00558b853087bf24d))
- **server:** fix the import of pg ([#51](https://github.com/ESP-Corevia/CoreApp/issues/51)) ([bec4497](https://github.com/ESP-Corevia/CoreApp/commit/bec4497eaa1549c5e978121fbfe5773fe471460d))
- **tsdown:** add outExtensions function to specify output file extensions ([#53](https://github.com/ESP-Corevia/CoreApp/issues/53)) ([b93b109](https://github.com/ESP-Corevia/CoreApp/commit/b93b10981f494b20ef8aa2b582f21b87311b6b81))

### 🧹 Refactors

- delete fields lastName and firstName ([#73](https://github.com/ESP-Corevia/CoreApp/issues/73)) ([5371359](https://github.com/ESP-Corevia/CoreApp/commit/53713596f0c31bbcf1424cebd531a63d7df20eb4))

### 🔧 Chores

- add .dockerignore files for server and web applications ([f9a7579](https://github.com/ESP-Corevia/CoreApp/commit/f9a7579d1f16aa4481625e58b6505355435b5818))
- create docker-compose.yml for managing multi-container application setup ([f9a7579](https://github.com/ESP-Corevia/CoreApp/commit/f9a7579d1f16aa4481625e58b6505355435b5818))
- refactor Dockerfile for web app to improve build process and dependencies ([f9a7579](https://github.com/ESP-Corevia/CoreApp/commit/f9a7579d1f16aa4481625e58b6505355435b5818))
- release master ([#46](https://github.com/ESP-Corevia/CoreApp/issues/46)) ([57654b3](https://github.com/ESP-Corevia/CoreApp/commit/57654b3f51e0fff6b4fffeac9d1f9e807bcc4ed8))
- release master ([#47](https://github.com/ESP-Corevia/CoreApp/issues/47)) ([0a5ca76](https://github.com/ESP-Corevia/CoreApp/commit/0a5ca76841750e35336e66ecc75d64841337f1ea))
- release master ([#49](https://github.com/ESP-Corevia/CoreApp/issues/49)) ([3531bb3](https://github.com/ESP-Corevia/CoreApp/commit/3531bb3b24618469e329cc1a88c53f6a381248e0))
- release master ([#52](https://github.com/ESP-Corevia/CoreApp/issues/52)) ([77d4e1f](https://github.com/ESP-Corevia/CoreApp/commit/77d4e1f6a6915d7f3eca927d174cc0cd36014298))
- release master ([#54](https://github.com/ESP-Corevia/CoreApp/issues/54)) ([aa9a4ca](https://github.com/ESP-Corevia/CoreApp/commit/aa9a4ca79be3fdd0cdec5e58de0a73f2a59f3fb8))
- release master ([#58](https://github.com/ESP-Corevia/CoreApp/issues/58)) ([bd08e5a](https://github.com/ESP-Corevia/CoreApp/commit/bd08e5af8b63092aa9787e4a60ecbe84e86a04e5))
- release master ([#59](https://github.com/ESP-Corevia/CoreApp/issues/59)) ([fe945cd](https://github.com/ESP-Corevia/CoreApp/commit/fe945cdb81d19e2b0195704bf09210c76d11c1df))
- release master ([#61](https://github.com/ESP-Corevia/CoreApp/issues/61)) ([aaaef10](https://github.com/ESP-Corevia/CoreApp/commit/aaaef101acded46035558669cc75c5129f8ff407))
- release master ([#74](https://github.com/ESP-Corevia/CoreApp/issues/74)) ([df429f5](https://github.com/ESP-Corevia/CoreApp/commit/df429f5ffca08415da8b16679e87b58c9f1c93cb))
- update package.json dependencies for web app to latest versions ([f9a7579](https://github.com/ESP-Corevia/CoreApp/commit/f9a7579d1f16aa4481625e58b6505355435b5818))
- update yarn.lock with new dependency versions and remove unused ones ([f9a7579](https://github.com/ESP-Corevia/CoreApp/commit/f9a7579d1f16aa4481625e58b6505355435b5818))

## [1.3.1](https://github.com/ESP-Corevia/CoreApp/compare/server-v1.3.0...server-v1.3.1) (2026-01-29)

### 🧹 Refactors

- delete fields lastName and firstName ([#73](https://github.com/ESP-Corevia/CoreApp/issues/73)) ([5371359](https://github.com/ESP-Corevia/CoreApp/commit/53713596f0c31bbcf1424cebd531a63d7df20eb4))

## [1.3.0](https://github.com/ESP-Corevia/CoreApp/compare/server-v1.2.0...server-v1.3.0) (2026-01-29)

### ✨ Features

- add migration test in ci and renovate ([#60](https://github.com/ESP-Corevia/CoreApp/issues/60)) ([4645de8](https://github.com/ESP-Corevia/CoreApp/commit/4645de8caa7f1eff2777249c614092873c79bc7d))

## [1.2.0](https://github.com/ESP-Corevia/CoreApp/compare/server-v1.1.1...server-v1.2.0) (2026-01-23)

### ✨ Features

- add dashboard admin ([#27](https://github.com/ESP-Corevia/CoreApp/issues/27)) ([86e8584](https://github.com/ESP-Corevia/CoreApp/commit/86e85846649be74d83cb9ed089a857e72e58142c))
- **admin:** add sessions management ([#34](https://github.com/ESP-Corevia/CoreApp/issues/34)) ([bd706cc](https://github.com/ESP-Corevia/CoreApp/commit/bd706cc38fbbd38abc8c640c2b5aaee71fe1d05a))
- **apps:** update trpc and react version and add catalog to yarn v4.12 ([#42](https://github.com/ESP-Corevia/CoreApp/issues/42)) ([375d2e3](https://github.com/ESP-Corevia/CoreApp/commit/375d2e39973d985cef8f01856452019a82e0e054))
- Docker and Kubernetes configuration ([#6](https://github.com/ESP-Corevia/CoreApp/issues/6)) ([f9a7579](https://github.com/ESP-Corevia/CoreApp/commit/f9a7579d1f16aa4481625e58b6505355435b5818))
- init front ([#4](https://github.com/ESP-Corevia/CoreApp/issues/4)) ([a84184c](https://github.com/ESP-Corevia/CoreApp/commit/a84184c19a556f1a61caa2d54e4322039d577a31))
- **server:** add banner ([#9](https://github.com/ESP-Corevia/CoreApp/issues/9)) ([e5d62c6](https://github.com/ESP-Corevia/CoreApp/commit/e5d62c695629c05962e400e93d0ed317f30f489f))
- **server:** add vitest init ([#13](https://github.com/ESP-Corevia/CoreApp/issues/13)) ([aa9fd02](https://github.com/ESP-Corevia/CoreApp/commit/aa9fd02e0c79265da58bee7a2cb3f14a6d8b8787))
- **server:** init repo and services for CRUD users ([#17](https://github.com/ESP-Corevia/CoreApp/issues/17)) ([e20ae10](https://github.com/ESP-Corevia/CoreApp/commit/e20ae106ff1baa5c981f99a7cba3d63d176ac40c))
- **web:** add tools dev & ci ([#19](https://github.com/ESP-Corevia/CoreApp/issues/19)) ([ea3a0da](https://github.com/ESP-Corevia/CoreApp/commit/ea3a0da0e43292a3fe3af4cd43c171da99994784))
- **web:** add user profile with settings page ([#25](https://github.com/ESP-Corevia/CoreApp/issues/25)) ([ea27c65](https://github.com/ESP-Corevia/CoreApp/commit/ea27c650c708a9e518c90d53f6d9c0620d101b74))

### 🐛 Fixes

- enhance trusted origins in authentication to include localhost ([f9a7579](https://github.com/ESP-Corevia/CoreApp/commit/f9a7579d1f16aa4481625e58b6505355435b5818))
- **server:** add merge OpenApiSchema ([#2](https://github.com/ESP-Corevia/CoreApp/issues/2)) ([b35ccbd](https://github.com/ESP-Corevia/CoreApp/commit/b35ccbd6fc81c90a57535bd00558b853087bf24d))
- **server:** fix the import of pg ([#51](https://github.com/ESP-Corevia/CoreApp/issues/51)) ([bec4497](https://github.com/ESP-Corevia/CoreApp/commit/bec4497eaa1549c5e978121fbfe5773fe471460d))
- **tsdown:** add outExtensions function to specify output file extensions ([#53](https://github.com/ESP-Corevia/CoreApp/issues/53)) ([b93b109](https://github.com/ESP-Corevia/CoreApp/commit/b93b10981f494b20ef8aa2b582f21b87311b6b81))

### 🔧 Chores

- add .dockerignore files for server and web applications ([f9a7579](https://github.com/ESP-Corevia/CoreApp/commit/f9a7579d1f16aa4481625e58b6505355435b5818))
- create docker-compose.yml for managing multi-container application setup ([f9a7579](https://github.com/ESP-Corevia/CoreApp/commit/f9a7579d1f16aa4481625e58b6505355435b5818))
- refactor Dockerfile for web app to improve build process and dependencies ([f9a7579](https://github.com/ESP-Corevia/CoreApp/commit/f9a7579d1f16aa4481625e58b6505355435b5818))
- release master ([#46](https://github.com/ESP-Corevia/CoreApp/issues/46)) ([57654b3](https://github.com/ESP-Corevia/CoreApp/commit/57654b3f51e0fff6b4fffeac9d1f9e807bcc4ed8))
- release master ([#47](https://github.com/ESP-Corevia/CoreApp/issues/47)) ([0a5ca76](https://github.com/ESP-Corevia/CoreApp/commit/0a5ca76841750e35336e66ecc75d64841337f1ea))
- release master ([#49](https://github.com/ESP-Corevia/CoreApp/issues/49)) ([3531bb3](https://github.com/ESP-Corevia/CoreApp/commit/3531bb3b24618469e329cc1a88c53f6a381248e0))
- release master ([#52](https://github.com/ESP-Corevia/CoreApp/issues/52)) ([77d4e1f](https://github.com/ESP-Corevia/CoreApp/commit/77d4e1f6a6915d7f3eca927d174cc0cd36014298))
- release master ([#54](https://github.com/ESP-Corevia/CoreApp/issues/54)) ([aa9a4ca](https://github.com/ESP-Corevia/CoreApp/commit/aa9a4ca79be3fdd0cdec5e58de0a73f2a59f3fb8))
- release master ([#58](https://github.com/ESP-Corevia/CoreApp/issues/58)) ([bd08e5a](https://github.com/ESP-Corevia/CoreApp/commit/bd08e5af8b63092aa9787e4a60ecbe84e86a04e5))
- update package.json dependencies for web app to latest versions ([f9a7579](https://github.com/ESP-Corevia/CoreApp/commit/f9a7579d1f16aa4481625e58b6505355435b5818))
- update yarn.lock with new dependency versions and remove unused ones ([f9a7579](https://github.com/ESP-Corevia/CoreApp/commit/f9a7579d1f16aa4481625e58b6505355435b5818))

## [1.1.1](https://github.com/ESP-Corevia/CoreApp/compare/server-v1.1.0...server-v1.1.1) (2026-01-23)

### 🐛 Fixes

- **tsdown:** add outExtensions function to specify output file extensions ([#53](https://github.com/ESP-Corevia/CoreApp/issues/53)) ([b93b109](https://github.com/ESP-Corevia/CoreApp/commit/b93b10981f494b20ef8aa2b582f21b87311b6b81))

### 🔧 Chores

- release master ([#54](https://github.com/ESP-Corevia/CoreApp/issues/54)) ([aa9a4ca](https://github.com/ESP-Corevia/CoreApp/commit/aa9a4ca79be3fdd0cdec5e58de0a73f2a59f3fb8))

## [1.1.0](https://github.com/ESP-Corevia/CoreApp/compare/server-v1.0.0...server-v1.1.0) (2026-01-16)

### ✨ Features

- add dashboard admin ([#27](https://github.com/ESP-Corevia/CoreApp/issues/27)) ([86e8584](https://github.com/ESP-Corevia/CoreApp/commit/86e85846649be74d83cb9ed089a857e72e58142c))
- **admin:** add sessions management ([#34](https://github.com/ESP-Corevia/CoreApp/issues/34)) ([bd706cc](https://github.com/ESP-Corevia/CoreApp/commit/bd706cc38fbbd38abc8c640c2b5aaee71fe1d05a))
- **apps:** update trpc and react version and add catalog to yarn v4.12 ([#42](https://github.com/ESP-Corevia/CoreApp/issues/42)) ([375d2e3](https://github.com/ESP-Corevia/CoreApp/commit/375d2e39973d985cef8f01856452019a82e0e054))
- Docker and Kubernetes configuration ([#6](https://github.com/ESP-Corevia/CoreApp/issues/6)) ([f9a7579](https://github.com/ESP-Corevia/CoreApp/commit/f9a7579d1f16aa4481625e58b6505355435b5818))
- init front ([#4](https://github.com/ESP-Corevia/CoreApp/issues/4)) ([a84184c](https://github.com/ESP-Corevia/CoreApp/commit/a84184c19a556f1a61caa2d54e4322039d577a31))
- **server:** add banner ([#9](https://github.com/ESP-Corevia/CoreApp/issues/9)) ([e5d62c6](https://github.com/ESP-Corevia/CoreApp/commit/e5d62c695629c05962e400e93d0ed317f30f489f))
- **server:** add vitest init ([#13](https://github.com/ESP-Corevia/CoreApp/issues/13)) ([aa9fd02](https://github.com/ESP-Corevia/CoreApp/commit/aa9fd02e0c79265da58bee7a2cb3f14a6d8b8787))
- **server:** init repo and services for CRUD users ([#17](https://github.com/ESP-Corevia/CoreApp/issues/17)) ([e20ae10](https://github.com/ESP-Corevia/CoreApp/commit/e20ae106ff1baa5c981f99a7cba3d63d176ac40c))
- **web:** add tools dev & ci ([#19](https://github.com/ESP-Corevia/CoreApp/issues/19)) ([ea3a0da](https://github.com/ESP-Corevia/CoreApp/commit/ea3a0da0e43292a3fe3af4cd43c171da99994784))
- **web:** add user profile with settings page ([#25](https://github.com/ESP-Corevia/CoreApp/issues/25)) ([ea27c65](https://github.com/ESP-Corevia/CoreApp/commit/ea27c650c708a9e518c90d53f6d9c0620d101b74))

### 🐛 Fixes

- enhance trusted origins in authentication to include localhost ([f9a7579](https://github.com/ESP-Corevia/CoreApp/commit/f9a7579d1f16aa4481625e58b6505355435b5818))
- **server:** add merge OpenApiSchema ([#2](https://github.com/ESP-Corevia/CoreApp/issues/2)) ([b35ccbd](https://github.com/ESP-Corevia/CoreApp/commit/b35ccbd6fc81c90a57535bd00558b853087bf24d))
- **server:** fix the import of pg ([#51](https://github.com/ESP-Corevia/CoreApp/issues/51)) ([bec4497](https://github.com/ESP-Corevia/CoreApp/commit/bec4497eaa1549c5e978121fbfe5773fe471460d))

### 🔧 Chores

- add .dockerignore files for server and web applications ([f9a7579](https://github.com/ESP-Corevia/CoreApp/commit/f9a7579d1f16aa4481625e58b6505355435b5818))
- create docker-compose.yml for managing multi-container application setup ([f9a7579](https://github.com/ESP-Corevia/CoreApp/commit/f9a7579d1f16aa4481625e58b6505355435b5818))
- refactor Dockerfile for web app to improve build process and dependencies ([f9a7579](https://github.com/ESP-Corevia/CoreApp/commit/f9a7579d1f16aa4481625e58b6505355435b5818))
- release master ([#46](https://github.com/ESP-Corevia/CoreApp/issues/46)) ([57654b3](https://github.com/ESP-Corevia/CoreApp/commit/57654b3f51e0fff6b4fffeac9d1f9e807bcc4ed8))
- release master ([#47](https://github.com/ESP-Corevia/CoreApp/issues/47)) ([0a5ca76](https://github.com/ESP-Corevia/CoreApp/commit/0a5ca76841750e35336e66ecc75d64841337f1ea))
- release master ([#49](https://github.com/ESP-Corevia/CoreApp/issues/49)) ([3531bb3](https://github.com/ESP-Corevia/CoreApp/commit/3531bb3b24618469e329cc1a88c53f6a381248e0))
- update package.json dependencies for web app to latest versions ([f9a7579](https://github.com/ESP-Corevia/CoreApp/commit/f9a7579d1f16aa4481625e58b6505355435b5818))
- update yarn.lock with new dependency versions and remove unused ones ([f9a7579](https://github.com/ESP-Corevia/CoreApp/commit/f9a7579d1f16aa4481625e58b6505355435b5818))

## 1.0.0 (2026-01-15)

### ✨ Features

- add dashboard admin ([#27](https://github.com/ESP-Corevia/CoreApp/issues/27)) ([86e8584](https://github.com/ESP-Corevia/CoreApp/commit/86e85846649be74d83cb9ed089a857e72e58142c))
- **admin:** add sessions management ([#34](https://github.com/ESP-Corevia/CoreApp/issues/34)) ([bd706cc](https://github.com/ESP-Corevia/CoreApp/commit/bd706cc38fbbd38abc8c640c2b5aaee71fe1d05a))
- **apps:** update trpc and react version and add catalog to yarn v4.12 ([#42](https://github.com/ESP-Corevia/CoreApp/issues/42)) ([375d2e3](https://github.com/ESP-Corevia/CoreApp/commit/375d2e39973d985cef8f01856452019a82e0e054))
- Docker and Kubernetes configuration ([#6](https://github.com/ESP-Corevia/CoreApp/issues/6)) ([f9a7579](https://github.com/ESP-Corevia/CoreApp/commit/f9a7579d1f16aa4481625e58b6505355435b5818))
- init front ([#4](https://github.com/ESP-Corevia/CoreApp/issues/4)) ([a84184c](https://github.com/ESP-Corevia/CoreApp/commit/a84184c19a556f1a61caa2d54e4322039d577a31))
- **server:** add banner ([#9](https://github.com/ESP-Corevia/CoreApp/issues/9)) ([e5d62c6](https://github.com/ESP-Corevia/CoreApp/commit/e5d62c695629c05962e400e93d0ed317f30f489f))
- **server:** add vitest init ([#13](https://github.com/ESP-Corevia/CoreApp/issues/13)) ([aa9fd02](https://github.com/ESP-Corevia/CoreApp/commit/aa9fd02e0c79265da58bee7a2cb3f14a6d8b8787))
- **server:** init repo and services for CRUD users ([#17](https://github.com/ESP-Corevia/CoreApp/issues/17)) ([e20ae10](https://github.com/ESP-Corevia/CoreApp/commit/e20ae106ff1baa5c981f99a7cba3d63d176ac40c))
- **web:** add tools dev & ci ([#19](https://github.com/ESP-Corevia/CoreApp/issues/19)) ([ea3a0da](https://github.com/ESP-Corevia/CoreApp/commit/ea3a0da0e43292a3fe3af4cd43c171da99994784))
- **web:** add user profile with settings page ([#25](https://github.com/ESP-Corevia/CoreApp/issues/25)) ([ea27c65](https://github.com/ESP-Corevia/CoreApp/commit/ea27c650c708a9e518c90d53f6d9c0620d101b74))

### 🐛 Fixes

- enhance trusted origins in authentication to include localhost ([f9a7579](https://github.com/ESP-Corevia/CoreApp/commit/f9a7579d1f16aa4481625e58b6505355435b5818))
- **server:** add merge OpenApiSchema ([#2](https://github.com/ESP-Corevia/CoreApp/issues/2)) ([b35ccbd](https://github.com/ESP-Corevia/CoreApp/commit/b35ccbd6fc81c90a57535bd00558b853087bf24d))

### 🔧 Chores

- add .dockerignore files for server and web applications ([f9a7579](https://github.com/ESP-Corevia/CoreApp/commit/f9a7579d1f16aa4481625e58b6505355435b5818))
- create docker-compose.yml for managing multi-container application setup ([f9a7579](https://github.com/ESP-Corevia/CoreApp/commit/f9a7579d1f16aa4481625e58b6505355435b5818))
- refactor Dockerfile for web app to improve build process and dependencies ([f9a7579](https://github.com/ESP-Corevia/CoreApp/commit/f9a7579d1f16aa4481625e58b6505355435b5818))
- release master ([#46](https://github.com/ESP-Corevia/CoreApp/issues/46)) ([57654b3](https://github.com/ESP-Corevia/CoreApp/commit/57654b3f51e0fff6b4fffeac9d1f9e807bcc4ed8))
- release master ([#47](https://github.com/ESP-Corevia/CoreApp/issues/47)) ([0a5ca76](https://github.com/ESP-Corevia/CoreApp/commit/0a5ca76841750e35336e66ecc75d64841337f1ea))
- update package.json dependencies for web app to latest versions ([f9a7579](https://github.com/ESP-Corevia/CoreApp/commit/f9a7579d1f16aa4481625e58b6505355435b5818))
- update yarn.lock with new dependency versions and remove unused ones ([f9a7579](https://github.com/ESP-Corevia/CoreApp/commit/f9a7579d1f16aa4481625e58b6505355435b5818))
