# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
## [3.0.1]
### Fixed
- Ignore instead of taking only symbolic links if skipLinks is set.

## [3.0.0]
### Added
- Add skipLinks option

### Changed
- **BREAKING**: require node.js >= 10.4.0
- Updated dependencies to latest version

## [2.0.1]
### Fixed
- Brace expression is not working, if the object has single value

## [2.0.0]
### Changed
- **BREAKING**: require node.js >= 8
- Use built-in `child_process` instead of `exec` module ([#11](https://github.com/L2jLiga/grunt-webfonts/pull/11))

## [1.1.6]
### Changed
- Updated dependencies
- Reduced lodash usage

### Fixed
- GitHub security alert
- npm security alert

## [1.1.5]
### Fixed
- npm audit vulnerabilities report

## [1.1.4]
### Changed
- Improved different SVGs support (again)

## [1.1.3]
### Changed
- Improved different SVGs support

## [1.1.2]
### Fixed
- Checksum error in glyf ([#7](https://github.com/L2jLiga/grunt-webfonts/issues/7))

## [1.1.1]
### Changed
- Replaced deprecated Buffer constructor
- Unpinned dependencies

## [1.1.0]
### Added
- Ligatures support

## [1.0.10] &ndash; 2018-08-30
### Fixed
- Invalid demo when `fontPathVariables` is true

## [1.0.7] &ndash; 2018-08-29
### Changed
+ Updated dependencies
+ Minor changes in package.json

### Fixed
- Invalid svg font generation on Node 10

## [1.0.6] &ndash; 2017-12-15
### Added
+ Support fontForge engine
+ Added `centerHorizontally` option (only `node` engine)

## [1.0.5] &ndash; 2017-12-15
### Changed
+ Update svgicons2svgfont to `^8.0.0`
+ Update ttf2woff to `^2.0.1`
+ Update ttf2eot to `^2.0.0`
+ Update chalk to `^2.3.0`
+ Update async to `^2.6.0`

## [1.0.4] &ndash; 2017-11-28
### Changed
+ Update svgicons2svgfont to `^7.0.2`

## [1.0.3] &ndash; 2017-11-28
### Changed
+ Update SVGO to `^1.0.3`

### Fixed
+ Output stylesheet name

## [1.0.2] &ndash; 2017-11-28
### Fixed
+ Added all needed files for correctly work
+ Fixed fatal issue with node engine

## [1.0.1] &ndash; 2017-11-28
### Changed
+ Downgrade packages

## 1.0.0 &ndash; 2017-11-28
### Changed
+ Migration to Grunt 1.0.0
+ Migration to ES6+
+ Migration to Node 6.9+

### Removed
+ FontForge engine
+ Tests (because they didn't work correctly)

[Unreleased]: https://github.com/L2jLiga/grunt-webfonts/compare/v3.0.1...HEAD
[3.0.1]: https://github.com/L2jLiga/grunt-webfonts/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/L2jLiga/grunt-webfonts/compare/v2.0.1...v3.0.0
[2.0.1]: https://github.com/L2jLiga/grunt-webfonts/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/L2jLiga/grunt-webfonts/compare/v1.1.6...v2.0.0
[1.1.6]: https://github.com/L2jLiga/grunt-webfonts/compare/v1.1.5...v1.1.6
[1.1.5]: https://github.com/L2jLiga/grunt-webfonts/compare/v1.1.4...v1.1.5
[1.1.4]: https://github.com/L2jLiga/grunt-webfonts/compare/v1.1.3...v1.1.4
[1.1.3]: https://github.com/L2jLiga/grunt-webfonts/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/L2jLiga/grunt-webfonts/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/L2jLiga/grunt-webfonts/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/L2jLiga/grunt-webfonts/compare/v1.0.10...v1.1.0
[1.0.10]: https://github.com/L2jLiga/grunt-webfonts/compare/v1.0.7...v1.0.10
[1.0.7]: https://github.com/L2jLiga/grunt-webfonts/compare/v1.0.6...v1.0.7
[1.0.6]: https://github.com/L2jLiga/grunt-webfonts/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/L2jLiga/grunt-webfonts/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/L2jLiga/grunt-webfonts/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/L2jLiga/grunt-webfonts/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/L2jLiga/grunt-webfonts/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/L2jLiga/grunt-webfonts/compare/v1.0.0...v1.0.1
