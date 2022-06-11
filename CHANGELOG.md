# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.1.6](https://github.com/ZeaInc/zea-tree-view/compare/v0.1.5...v0.1.6) (2022-06-11)

### Features

- Allow users to specify a CSS file for the tree view to load to support more customization. ([3c87b66](https://github.com/ZeaInc/zea-tree-view/commit/2c87b6624ab8913d1349d26984db54fa2559893a))
- Display an SVG chevron on the expand/collapse button. ([fea1e1d](https://github.com/ZeaInc/zea-tree-view/commit/fea1e1d0a28c646410690daaa3bdb000e2e94aba))
- Scroll into view after item selection or at the end of search. ([1ffdf29](https://github.com/ZeaInc/zea-tree-view/commit/1ffdf29b18254fadc782950ae7bcfb95f0450fb1))

### Bug Fixes

- After ending a search, selected items are left fully expanded. ([b3cda81](https://github.com/ZeaInc/zea-tree-view/commit/b3cda81b5feb9424abb772bbd4dfc7cb3cafab92))
- The +/- symbol is not correctly updated when expanding rows. ([8bb4a29](https://github.com/ZeaInc/zea-tree-view/commit/8bb4a2919b98b5494422bd1ab457b62573a20357))
- When expanding a row, the children rows are now correctly inserted when previous siblings were also expanded. ([74ac3b9](https://github.com/ZeaInc/zea-tree-view/commit/74ac3b953602278159db836d41c13b923fc5d4a0))

### [0.1.5](https://github.com/ZeaInc/zea-tree-view/compare/v0.1.3...v0.1.5) (2022-05-06)

### Features

- Add support for custom CSS ([#39](https://github.com/ZeaInc/zea-tree-view/issues/39)) ([bb48dad](https://github.com/ZeaInc/zea-tree-view/commit/bb48dad11d379b9a50af5ca36fb3bfcc63e7d3e0))

### [0.1.4](https://github.com/ZeaInc/zea-tree-view/compare/v0.1.3...v0.1.4) (2022-04-27)

### [0.1.3](https://github.com/ZeaInc/zea-tree-view/compare/v0.1.2...v0.1.3) (2022-03-30)

### Bug Fixes

- Cleaned up regression in tree item expansion ([d5c3776](https://github.com/ZeaInc/zea-tree-view/commit/d5c37760074130338fd8d0890ca5121369524099))
- Expand button text is now correctly reflected. ([1d9390f](https://github.com/ZeaInc/zea-tree-view/commit/1d9390fce3f5d0de770da6ca752abf1756ed3168))
- Selected rows outlines ([9d3e5e6](https://github.com/ZeaInc/zea-tree-view/commit/9d3e5e6c9db69381c8b1a7c1ba8418809b00e39c))
- Visibility checkbox now reflects the visibleParam.value, rather than the computed visibility value. ([d61a8d4](https://github.com/ZeaInc/zea-tree-view/commit/d61a8d4fe6e3c239ff1401c391a6e5bc6bdbc085))

### [0.1.2](https://github.com/ZeaInc/zea-tree-view/compare/v0.1.1...v0.1.2) (2022-03-22)

### Bug Fixes

- Performance and layout ([#32](https://github.com/ZeaInc/zea-tree-view/issues/32)) ([67ee56e](https://github.com/ZeaInc/zea-tree-view/commit/67ee56e4eeda328dbd0e274d306cc65e727d21a6)), closes [#9](https://github.com/ZeaInc/zea-tree-view/issues/9) [#3](https://github.com/ZeaInc/zea-tree-view/issues/3) [#22](https://github.com/ZeaInc/zea-tree-view/issues/22) [#26](https://github.com/ZeaInc/zea-tree-view/issues/26) [#27](https://github.com/ZeaInc/zea-tree-view/issues/27) [#33](https://github.com/ZeaInc/zea-tree-view/issues/33) [#36](https://github.com/ZeaInc/zea-tree-view/issues/36)

### [0.1.1](https://github.com/ZeaInc/zea-tree-view/compare/v0.1.0...v0.1.1) (2022-02-24)

### Features

- Add `undoRedoManager` ([2eebced](https://github.com/ZeaInc/zea-tree-view/commit/2eebcedfbb807cacc7d56d800cef34b497557b1a))

## [0.1.0](https://github.com/ZeaInc/zea-tree-view/compare/v0.0.8...v0.1.0) (2022-02-21)

### ⚠ BREAKING CHANGES

- Use "index" for output files

### build

- Use "index" for output files ([7631be5](https://github.com/ZeaInc/zea-tree-view/commit/7631be53068b022519556fdadc67b32f31c1c1f4)), closes [#30](https://github.com/ZeaInc/zea-tree-view/issues/30)

### [0.0.8](https://github.com/ZeaInc/zea-tree-view/compare/v0.0.7...v0.0.8) (2022-02-21)

### Features

- Make the tree items scrollable vertically ([c64d806](https://github.com/ZeaInc/zea-tree-view/commit/c64d806b183348078b999122eba32eccecaeb042)), closes [#29](https://github.com/ZeaInc/zea-tree-view/issues/29)
