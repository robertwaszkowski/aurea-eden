# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.42.0](https://github.com/robertwaszkowski/aurea-eden/compare/v1.41.1...v1.42.0) (2026-03-23)


### Features

* Add `BpmnToFluentConverter` class, its conversion algorithm documentation, and a usage demo. ([b902735](https://github.com/robertwaszkowski/aurea-eden/commit/b902735bca97f17242f725a3835e2484834c45ac))
* Add initial LaTeX and PDF files for the "Dynamic Topological Layout and Orthogonal Routing Algorithm for BPMN Diagrams" paper. ([0f985c4](https://github.com/robertwaszkowski/aurea-eden/commit/0f985c40b009e6fd22800b1cbb5cb8bb73f9df4f))
* AnchorPoint merging to invisible waypoints ([0980e02](https://github.com/robertwaszkowski/aurea-eden/commit/0980e026f66c3f11d1ba28b3683e945f6ed84b43))
* **bpmn-converter:** Implement DFS topological back-edge routing for Gateways ([a6d589a](https://github.com/robertwaszkowski/aurea-eden/commit/a6d589a6f96c0daea0703e89f9cb47355276064b))
* **bpmn-converter:** implement two-pass multi-lane branch layout ([fc61767](https://github.com/robertwaszkowski/aurea-eden/commit/fc61767eb543d7110272debe260465caa9c1002b))
* **bpmn-demo:** add 1:2 panel ratio, Auto Layout button and animated pipeline playback ([e7356d2](https://github.com/robertwaszkowski/aurea-eden/commit/e7356d2050552155260d3b702daa5ee27a9f5806))
* **bpmn-demo:** add Phase 0 Topology pipeline stage with BFS level layout ([7189a7e](https://github.com/robertwaszkowski/aurea-eden/commit/7189a7ebc03d5e53a9691ea914cf36545eae53dc))
* **bpmn-demo:** add Resolve Overlaps as a proper 4th pipeline stage ([a32ad3e](https://github.com/robertwaszkowski/aurea-eden/commit/a32ad3e3321643a90811ef9ccf9442da11fd6646))
* **bpmn-diagram:** Add overlap detection, visual highlighting, and fix connector point staleness ([0cbba13](https://github.com/robertwaszkowski/aurea-eden/commit/0cbba135657aa36966b796eba529ac08de1113bc))
* **bpmn:** add export dependency and demo interface ([72832ad](https://github.com/robertwaszkowski/aurea-eden/commit/72832ad54de51fe048a7f5048daf40a973fe4b38))
* **bpmn:** implement native semantic tagging for diagram elements ([a6810f4](https://github.com/robertwaszkowski/aurea-eden/commit/a6810f40303690dc50abe1e80677cf2cc360880e))
* **bpmn:** unify and fix label spacing for elements and sequence flows ([ea10eee](https://github.com/robertwaszkowski/aurea-eden/commit/ea10eee2d98d67b1ad94b6177b16e20c506c4443))
* **converter:** compute cardinal source port (N/E/S/W) for multi-output elements ([ec0f31a](https://github.com/robertwaszkowski/aurea-eden/commit/ec0f31acb21fe628d698a6d86154fd8fc8067bc6))
* **converter:** enforce strict gateway exit port rules (N/E/S) ([03a1042](https://github.com/robertwaszkowski/aurea-eden/commit/03a104285f1611963ee54925833388c47fdd66e2))
* **converter:** enforce Upward placement rule for End Events attached to Gateways ([ed9dac5](https://github.com/robertwaszkowski/aurea-eden/commit/ed9dac5dd4c10cc86e27e410e34a2d8b1fb2ff12))
* **converter:** explicit port selection and smarter branch placement for 2-output elements ([468ffba](https://github.com/robertwaszkowski/aurea-eden/commit/468ffba42f8d4484a70692a488066d88db88a82a))
* **converter:** implement BpmnToFluentConverter to output fluent API syntax automatically ([8f27f88](https://github.com/robertwaszkowski/aurea-eden/commit/8f27f884c31c8222f048645bc16563b990993d09))
* **converter:** use 'explicit' source port for gateways with 2+ outgoing flows ([cbb7a2e](https://github.com/robertwaszkowski/aurea-eden/commit/cbb7a2e493d3ceb6ea6be0d8ebeb322d9508fddf))
* **demo:** add BpmnConverterDemo showing native XML vs auto-generated fluent API side-by-side ([00cfda5](https://github.com/robertwaszkowski/aurea-eden/commit/00cfda5db230e087c9f5df9effd87fab6b405763))
* **demo:** add phase toggles to bpmn converter ui ([73b744e](https://github.com/robertwaszkowski/aurea-eden/commit/73b744e3f53ee610eea8640a269a3e633dae9edc))
* **demo:** add phase toggles to BpmnConverterDemo ([2e70a90](https://github.com/robertwaszkowski/aurea-eden/commit/2e70a9087f135e11157aafd4329d3ae4051c5ffd))
* **demo:** BpmnConverterDemo as default; add BPMN file picker with 4 diagrams ([19ee1f9](https://github.com/robertwaszkowski/aurea-eden/commit/19ee1f9192d651f1076d0e5163ef612df7e9d073))
* **elements:** intelligent auto port resolution for L-curves ([c97a6a1](https://github.com/robertwaszkowski/aurea-eden/commit/c97a6a1fa16e86e29aeebfb879ecd5921c64d6cd))
* Introduce core diagram Element class and initial BPMN to Fluent converter. ([d9e4467](https://github.com/robertwaszkowski/aurea-eden/commit/d9e4467e6bcaf1f0320b7648c2b745da71795134))
* **routing:** implement advanced multi-segment orthagonal routing & layout demos ([ec3a0df](https://github.com/robertwaszkowski/aurea-eden/commit/ec3a0df942ac01cd6ebd2a42145ec722f4fc0e12))


### Bug Fixes

* **bpmn-converter:** port-spreading to prevent collinear connector overlaps ([b530aeb](https://github.com/robertwaszkowski/aurea-eden/commit/b530aebab5a4f706340944de27e6faff4a8dc912))
* **connector:** Silently defer label creation when connector has no points yet ([0eaf278](https://github.com/robertwaszkowski/aurea-eden/commit/0eaf2780af13d9b114a73d5200e0f3b0d9ba1039))
* **converter:** skip labels for unnamed elements; map terminateEndEvent correctly ([4d4da90](https://github.com/robertwaszkowski/aurea-eden/commit/4d4da902e6adfc2d47d3f7a1b13a46844b7af79a))
* **converter:** use positionRightOf for same-row branch elements ([fff33bb](https://github.com/robertwaszkowski/aurea-eden/commit/fff33bb24711ab9c7e0d3d9ebfb4b7e67b3e0712))
* correct bpmn export coordinate mapping and overlap markers ([e23670f](https://github.com/robertwaszkowski/aurea-eden/commit/e23670f1542780aa04881b6baead8bb65bdc7168))
* **elements:** generate L-curves for diagonal auto-to-auto connections ([b765479](https://github.com/robertwaszkowski/aurea-eden/commit/b765479523fafbe9cd0c560e9ab4b2313aa2e951))
* Improve connector routing and port spreading mechanics ([30f62ac](https://github.com/robertwaszkowski/aurea-eden/commit/30f62ac495a0b759ea51b8bfa1fa380fb4d0b021))
* **notations:** update relative import paths after moving to per-notation subfolders ([e509929](https://github.com/robertwaszkowski/aurea-eden/commit/e5099298bef56161eda43144d55d2dd66502eb0c))

### [1.41.1](https://github.com/robertwaszkowski/aurea-eden/compare/v1.41.0...v1.41.1) (2026-02-28)

## [1.41.0](https://github.com/robertwaszkowski/aurea-eden/compare/v1.40.2...v1.41.0) (2026-02-28)


### Features

* Add several new BPMN templates for various use cases to the demo. ([03e6fc5](https://github.com/robertwaszkowski/aurea-eden/commit/03e6fc54fe3dfc553aaaf4bf502d872b47a259e2))
* **bpmn:** implement 3D structural rendering for Swimlanes (Pools and Lanes) ([9c03543](https://github.com/robertwaszkowski/aurea-eden/commit/9c035437fa544fcf7d52fe1bcec57ac985608178))


### Bug Fixes

* fix badge width, ANALYZE exit tilt, and sprite label counter ([240c754](https://github.com/robertwaszkowski/aurea-eden/commit/240c754aa19e509ca708c053caf422202697631d))
* fix BPMN sequence flow rendering for collinear and off-axis waypoints ([22ba974](https://github.com/robertwaszkowski/aurea-eden/commit/22ba9747be85054980a9eb18ac5b0d49a87a013d))
* Handle missing BPMNDI bounds for sequence flows and label positioning ([02fe512](https://github.com/robertwaszkowski/aurea-eden/commit/02fe51292b8e0c079c2bd532a6d4826cca720a21))
* scale gateway icons proportionally to gateway diamond width ([35a89aa](https://github.com/robertwaszkowski/aurea-eden/commit/35a89aa73cf8426e3054fa4338a7908af73fdf05))

### [1.40.2](https://github.com/robertwaszkowski/aurea-eden/compare/v1.40.1...v1.40.2) (2026-01-28)

### [1.40.1](https://github.com/robertwaszkowski/aurea-eden/compare/v1.40.0...v1.40.1) (2026-01-28)

## [1.40.0](https://github.com/robertwaszkowski/aurea-eden/compare/v1.39.0...v1.40.0) (2026-01-28)


### Features

* **analyze:** implement spectacular triple-stage exit animation ([ccb4280](https://github.com/robertwaszkowski/aurea-eden/commit/ccb428035c152b94a4ac69973f20a5e96babcae2))
* **analyze:** overhaul ANALYZE mode UI with HUD-style labels and theme adaptability ([c07fd18](https://github.com/robertwaszkowski/aurea-eden/commit/c07fd1834290929ee2742b45c9cceac03f733915))
* **animation:** refine data bubble exit transition ([24e93e9](https://github.com/robertwaszkowski/aurea-eden/commit/24e93e906ced68f7eb5bfe1a68db068ba8096de7))

## [1.39.0](https://github.com/robertwaszkowski/aurea-eden/compare/v1.38.0...v1.39.0) (2026-01-26)


### Features

* implement automatic mode reactivity in BpmnDiagram Vue wrapper ([58209e9](https://github.com/robertwaszkowski/aurea-eden/commit/58209e94b2bfc5e01a6a474a5a0deec8124bcad8))

## [1.38.0](https://github.com/robertwaszkowski/aurea-eden/compare/v1.37.1...v1.38.0) (2026-01-25)


### Features

* **diagram:** implement precise diagram centering and unified camera reset ([6dbaf69](https://github.com/robertwaszkowski/aurea-eden/commit/6dbaf69e1e6bd2fadd03b27e46e6ee6489cabd9a))

### [1.37.1](https://github.com/robertwaszkowski/aurea-eden/compare/v1.37.0...v1.37.1) (2026-01-25)

## [1.37.0](https://github.com/robertwaszkowski/aurea-eden/compare/v1.36.0...v1.37.0) (2026-01-25)


### Features

* **diagram:** implement seamless camera switching with subtle jumping effect ([7eeef7c](https://github.com/robertwaszkowski/aurea-eden/commit/7eeef7cd255def848b2b76a19d67bbcba60296c9))


### Bug Fixes

* **diagram:** restore and refine robust container resizing ([a5bfc94](https://github.com/robertwaszkowski/aurea-eden/commit/a5bfc94b8c05bcc4def2b1507099996bc4d41603))

## [1.36.0](https://github.com/robertwaszkowski/aurea-eden/compare/v1.35.0...v1.36.0) (2026-01-24)


### Features

* finalize premium BPMN visual system with Neutral Dark Grey aesthetic ([ff3c146](https://github.com/robertwaszkowski/aurea-eden/commit/ff3c14626563b9296c9c23273de3eab41bfa8f69))

## [1.35.0](https://github.com/robertwaszkowski/aurea-eden/compare/v1.34.1...v1.35.0) (2026-01-24)


### Features

* standardize BPMN visuals, enhance ANALYZE mode, and unify theme/mode synchronization ([58b8c91](https://github.com/robertwaszkowski/aurea-eden/commit/58b8c9104760256a6f128e04da7ebc034cf7a590))

### [1.34.1](https://github.com/robertwaszkowski/aurea-eden/compare/v1.34.0...v1.34.1) (2026-01-24)

## [1.34.0](https://github.com/robertwaszkowski/aurea-eden/compare/v1.33.0...v1.34.0) (2026-01-24)


### Features

* **bpmn:** standardize visuals, simplify text API, and refine ANALYZE mode ([2b362f6](https://github.com/robertwaszkowski/aurea-eden/commit/2b362f69cd4be760ac8dd1dbff6591f2990c1d63))

## [1.33.0](https://github.com/robertwaszkowski/aurea-eden/compare/v1.32.1...v1.33.0) (2026-01-22)


### Features

* Add 3D Faceted StarShape and dynamic lighting support ([1c9ea22](https://github.com/robertwaszkowski/aurea-eden/commit/1c9ea2258366649461120fd58c7d19a78bdc32fa))
* Add 3D Faceted StarShape and dynamic lighting support ([a8793a4](https://github.com/robertwaszkowski/aurea-eden/commit/a8793a45545a010ba78f2e5c2a7cd7e99912e526))
* enhance ANALYZE mode with animated value bars and smart labels ([083ccc5](https://github.com/robertwaszkowski/aurea-eden/commit/083ccc5ee29a3ea388e14ad0886bd18e3e130227))
* implement explicit control for badge animation ([3ebfad6](https://github.com/robertwaszkowski/aurea-eden/commit/3ebfad6e4b4022ae33aa67bf946d7022096e12d9))

### [1.32.1](https://github.com/robertwaszkowski/aurea-eden/compare/v1.32.0...v1.32.1) (2026-01-21)

## [1.32.0](https://github.com/robertwaszkowski/aurea-eden/compare/v1.31.0...v1.32.0) (2026-01-21)


### Features

* improve BPMN label positioning ([448014a](https://github.com/robertwaszkowski/aurea-eden/commit/448014afeafa27c4d539c9ed4944f449d0bb4f47))

## [1.31.0](https://github.com/robertwaszkowski/aurea-eden/compare/v1.30.19...v1.31.0) (2026-01-20)


### Features

* add new BPMN diagram, custom shapes, and custom diagram notation. ([0f7da54](https://github.com/robertwaszkowski/aurea-eden/commit/0f7da54b91a58617705b9e4ed46939c386e2c726))
* Add new shapes and a process flow demo, including a StraightDottedConnectorShape. ([a51de7c](https://github.com/robertwaszkowski/aurea-eden/commit/a51de7c922710a34468ef93964eea59d68bac5ef))
* **bpmn:** add text annotations, associations, and text wrapping ([5978e55](https://github.com/robertwaszkowski/aurea-eden/commit/5978e55ef90edc1f9ac66f5c729a3e75fac184fb))
* Implement initial demo showcasing various shapes and core element components with build output. ([04a2a10](https://github.com/robertwaszkowski/aurea-eden/commit/04a2a10d6fdbb648a40fde257d161ba3c307fcb5))
* introduce BPMN diagram notation and update build artifacts. ([011eaad](https://github.com/robertwaszkowski/aurea-eden/commit/011eaadd0f9835e55fe3090a14d96416f69c6848))
* Introduce custom shapes, badge functionality for elements, and a new BPMN order processing demo. ([2025711](https://github.com/robertwaszkowski/aurea-eden/commit/2025711b6406b41d15a7f501f22ae6b8e5bb4f6a))
* introduce Element class with badge support and StraightDottedConnectorShape, demonstrated in a new demo. ([195177e](https://github.com/robertwaszkowski/aurea-eden/commit/195177ebe710ea5f5196dbd5bec354dbab45b8ed))

### [1.30.19](https://github.com/robertwaszkowski/aurea-eden/compare/v1.30.18...v1.30.19) (2026-01-20)

### [1.30.18](https://github.com/robertwaszkowski/aurea-eden/compare/v1.30.17...v1.30.18) (2026-01-20)

### [1.30.17](https://github.com/robertwaszkowski/aurea-eden/compare/v1.30.16...v1.30.17) (2026-01-20)

### [1.30.16](https://github.com/robertwaszkowski/aurea-eden/compare/v1.30.15...v1.30.16) (2026-01-20)

### [1.30.15](https://github.com/robertwaszkowski/aurea-eden/compare/v1.30.14...v1.30.15) (2026-01-20)

### [1.30.14](https://github.com/robertwaszkowski/aurea-eden/compare/v1.30.13...v1.30.14) (2026-01-20)

### [1.30.13](https://github.com/robertwaszkowski/aurea-eden/compare/v1.30.12...v1.30.13) (2026-01-20)

### [1.30.12](https://github.com/robertwaszkowski/aurea-eden/compare/v1.30.11...v1.30.12) (2026-01-20)

### [1.30.11](https://github.com/robertwaszkowski/aurea-eden/compare/v1.30.10...v1.30.11) (2026-01-14)

### [1.30.10](https://github.com/robertwaszkowski/aurea-eden/compare/v1.30.9...v1.30.10) (2026-01-14)

### [1.30.9](https://github.com/robertwaszkowski/aurea-eden/compare/v1.30.8...v1.30.9) (2026-01-14)

### [1.30.8](https://github.com/robertwaszkowski/aurea-eden/compare/v1.30.7...v1.30.8) (2026-01-14)

### [1.30.7](https://github.com/robertwaszkowski/aurea-eden/compare/v1.30.6...v1.30.7) (2026-01-14)

### [1.30.6](https://github.com/robertwaszkowski/aurea-eden/compare/v1.30.5...v1.30.6) (2026-01-13)

### [1.30.5](https://github.com/robertwaszkowski/aurea-eden/compare/v1.30.4...v1.30.5) (2026-01-13)

### [1.30.4](https://github.com/robertwaszkowski/aurea-eden/compare/v1.30.3...v1.30.4) (2026-01-12)

### [1.30.3](https://github.com/robertwaszkowski/aurea-eden/compare/v1.30.2...v1.30.3) (2026-01-12)

### [1.30.2](https://github.com/robertwaszkowski/aurea-eden/compare/v1.30.1...v1.30.2) (2026-01-12)

### [1.30.1](https://github.com/robertwaszkowski/aurea-eden/compare/v1.30.0...v1.30.1) (2026-01-10)

## [1.30.0](https://github.com/robertwaszkowski/aurea-eden/compare/v1.29.4...v1.30.0) (2026-01-10)


### Features

* add active task badges to BPMN diagram and update demo defaults ([b8de77b](https://github.com/robertwaszkowski/aurea-eden/commit/b8de77be5d53f44d264d6505ad21ff22ede314e4))

### [1.29.4](https://github.com/robertwaszkowski/aurea-eden/compare/v1.29.3...v1.29.4) (2026-01-10)

### [1.29.3](https://github.com/robertwaszkowski/aurea-eden/compare/v1.29.2...v1.29.3) (2026-01-10)

### [1.29.2](https://github.com/robertwaszkowski/aurea-eden/compare/v1.29.1...v1.29.2) (2026-01-10)

### [1.29.1](https://github.com/robertwaszkowski/aurea-eden/compare/v1.29.0...v1.29.1) (2026-01-09)

## [1.29.0](https://github.com/robertwaszkowski/aurea-eden/compare/v1.28.5...v1.29.0) (2026-01-09)


### Features

* add badge demo and GIF support ([79d3673](https://github.com/robertwaszkowski/aurea-eden/commit/79d36734a50a24b8827e95b5edbddb45c35fa73b))

### [1.28.5](https://github.com/robertwaszkowski/aurea-eden/compare/v1.28.4...v1.28.5) (2026-01-07)

### [1.28.4](https://github.com/robertwaszkowski/aurea-eden/compare/v1.28.3...v1.28.4) (2026-01-07)

### [1.28.3](https://github.com/robertwaszkowski/aurea-eden/compare/v1.28.2...v1.28.3) (2026-01-07)

### [1.28.2](https://github.com/robertwaszkowski/aurea-eden/compare/v1.28.1...v1.28.2) (2026-01-07)

### [1.28.1](https://github.com/robertwaszkowski/aurea-eden/compare/v1.28.0...v1.28.1) (2026-01-07)

## [1.28.0](https://github.com/robertwaszkowski/aurea-eden/compare/v1.27.15...v1.28.0) (2026-01-07)


### Features

* add order processing flow with tasks and gateways in index-DiTg-aTM.js ([cfca281](https://github.com/robertwaszkowski/aurea-eden/commit/cfca28166bc4247c4702ab7b5e1c5e6fa701cba9))

### [1.27.15](https://github.com/robertwaszkowski/aurea-eden/compare/v1.27.14...v1.27.15) (2026-01-05)

### [1.27.14](https://github.com/robertwaszkowski/aurea-eden/compare/v1.27.13...v1.27.14) (2026-01-05)


### Features

* Add AureaEdenBpmnDiagram Vue component and demo integration ([3a9a6aa](https://github.com/robertwaszkowski/aurea-eden/commit/3a9a6aa8fa4fe2413fc5e6a1c7cab1c67e22ae48))
* Improve ANALYZE mode animation sequence and bar rising effect ([8307a82](https://github.com/robertwaszkowski/aurea-eden/commit/8307a82712b0c9caf03576f1c9dd6cb35f809d91))


### Bug Fixes

* Call fitScreen after parsing BPMN XML to initialize camera state ([c68ad54](https://github.com/robertwaszkowski/aurea-eden/commit/c68ad54812ee80d7c8eb10bc781e06eee5023bbf))
* Resolve Vue module specifier error using import map ([1132a8c](https://github.com/robertwaszkowski/aurea-eden/commit/1132a8cbda81a586935faf255e011c11c3fbb694))
* Update Element geometry when TextShape geometry changes ([aa4d2d6](https://github.com/robertwaszkowski/aurea-eden/commit/aa4d2d6267e106160ea3e0ab7ffca4462eaddcf4))

### [1.27.13](https://github.com/robertwaszkowski/aurea-eden/compare/v1.27.12...v1.27.13) (2025-12-21)

### [1.27.12](https://github.com/robertwaszkowski/aurea-eden/compare/v1.27.11...v1.27.12) (2025-12-21)

### [1.27.11](https://github.com/robertwaszkowski/aurea-eden/compare/v1.27.10...v1.27.11) (2025-12-20)

### [1.27.10](https://github.com/robertwaszkowski/aurea-eden/compare/v1.27.9...v1.27.10) (2025-12-20)

### [1.27.9](https://github.com/robertwaszkowski/aurea-eden/compare/v1.27.8...v1.27.9) (2025-12-20)

### [1.27.8](https://github.com/robertwaszkowski/aurea-eden/compare/v1.27.7...v1.27.8) (2025-12-20)

### [1.27.7](https://github.com/robertwaszkowski/aurea-eden/compare/v1.27.6...v1.27.7) (2025-12-20)

### [1.27.6](https://github.com/robertwaszkowski/aurea-eden/compare/v1.27.5...v1.27.6) (2025-12-20)

### [1.27.5](https://github.com/robertwaszkowski/aurea-eden/compare/v1.27.4...v1.27.5) (2025-12-20)

### [1.27.4](https://github.com/robertwaszkowski/aurea-eden/compare/v1.27.3...v1.27.4) (2025-12-20)

### [1.27.3](https://github.com/robertwaszkowski/aurea-eden/compare/v1.27.2...v1.27.3) (2025-12-20)

### [1.27.2](https://github.com/robertwaszkowski/aurea-eden/compare/v1.27.1...v1.27.2) (2025-12-20)

### [1.27.1](https://github.com/robertwaszkowski/aurea-eden/compare/v1.27.0...v1.27.1) (2025-12-20)

## [1.27.0](https://github.com/robertwaszkowski/aurea-eden/compare/v1.26.0...v1.27.0) (2025-12-20)


### Features

* Add various shape classes for 3D rendering ([6ca4154](https://github.com/robertwaszkowski/aurea-eden/commit/6ca4154873971dc9b708e00afced2735d61bad24))
* **demo:** add Order Processing demo with BPMN diagram elements ([d0cb373](https://github.com/robertwaszkowski/aurea-eden/commit/d0cb3731f788b179ddeae30f9742fef7694a357b))
* update dependencies and configure Vite for Vue support ([93b4ff8](https://github.com/robertwaszkowski/aurea-eden/commit/93b4ff8494d9a0d34b330454980f03378022145b))

## 1.26.0 (2025-12-14)


### Features

* **diagram:** enhance BPMN diagram with dynamic value bars and color coding ([486447a](https://github.com/robertwaszkowski/aurea-eden/commit/486447a08015e4c243811245b723af0475b5fbef))


### Bug Fixes

* correct order of commands in deploy-gh-pages script ([49a414a](https://github.com/robertwaszkowski/aurea-eden/commit/49a414aa7d079092eaefed2b7f408d201b68e8e6))
* enhance camera zoom functionality ([be369b9](https://github.com/robertwaszkowski/aurea-eden/commit/be369b998ac83afa6424d7ace7205da33299cef0))

### [1.25.11](https://github.com/robertwaszkowski/aurea-eden/compare/v1.25.10...v1.25.11) (2025-05-19)

### [1.25.10](https://github.com/robertwaszkowski/aurea-eden/compare/v1.25.9...v1.25.10) (2025-05-19)


### Bug Fixes

* enhance camera zoom functionality ([be369b9](https://github.com/robertwaszkowski/aurea-eden/commit/be369b998ac83afa6424d7ace7205da33299cef0))

### [1.25.9](https://github.com/robertwaszkowski/aurea-eden/compare/v1.25.8...v1.25.9) (2025-05-11)

### [1.25.8](https://github.com/robertwaszkowski/aurea-eden/compare/v1.25.7...v1.25.8) (2025-05-11)

### [1.25.7](https://github.com/robertwaszkowski/aurea-eden/compare/v1.25.6...v1.25.7) (2025-05-11)

### [1.25.6](https://github.com/robertwaszkowski/aurea-eden/compare/v1.25.5...v1.25.6) (2025-05-11)

### [1.25.5](https://github.com/robertwaszkowski/aurea-eden/compare/v1.25.4...v1.25.5) (2025-05-11)


### Bug Fixes

* correct order of commands in deploy-gh-pages script ([49a414a](https://github.com/robertwaszkowski/aurea-eden/commit/49a414aa7d079092eaefed2b7f408d201b68e8e6))

### [1.25.4](https://github.com/robertwaszkowski/aurea-eden/compare/v1.25.3...v1.25.4) (2025-05-11)

### [1.25.3](https://github.com/robertwaszkowski/aurea-eden/compare/v1.25.2...v1.25.3) (2025-05-11)

### 1.25.2 (2025-05-11)

### [1.25.1](https://gitlab.tecna.pl/waszkowski_r/three-diagram/compare/v1.25.0...v1.25.1) (2025-04-30)

## [1.25.0](https://gitlab.tecna.pl/waszkowski_r/three-diagram/compare/v1.24.0...v1.25.0) (2025-04-30)

## [1.24.0] - 2025-04-30
### Added
- Complete JSDoc documentation for main module and components

## [1.1.0] - 2025-04-26
### Added
- New sample diagrams for demonstration
- Spot light functionality for better 3D visualization
### Changed
- Enhanced diagram display modes

## [1.0.0] - 2025-03-16
### Added
- Complete BPMN notation support
- BPMN elements and icons
- Icon placeholders system
- Text wrapping functionality
### Changed
- Improved icon shape handling

## [0.3.0] - 2025-02-28
### Added
- BPMN parser functionality
- Connector system for diagram elements
### Changed
- Major project reorganization
- API improvements

## [0.2.0] - 2025-02-16
### Added
- Bar visualization with random heights and colors
- Text support for elements
- Analysis mode with TWEEN animations
### Changed
- Controls system with map and orbit controls
- Project files organization refactor

## [0.1.0] - 2025-01-23
### Added
- Basic BPMN shapes and elements
- Diagram modes (EDIT, VIEW)
- Camera controls and adjustments
- Map controls for EDIT mode
- Window resize handling
- Favicon support

## [0.0.1] - 2025-01-13
### Added
- Initial project setup
- Basic Three.js integration
- Project structure
- License
