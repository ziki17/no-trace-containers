# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-05-16

### Added
- Initial release.
- Mark any Multi-Account Container as "no history" via popup or options page.
- Three-phase history deletion (`onCommitted`, `onCompleted`, `onRemoved`) to win the race against Firefox's history writer.
- Optional: wipe cookies for marked containers when the last tab of that container closes.
- Settings persisted in `browser.storage.local`.
- Manifest V3, `strict_min_version` 142.0.

[Unreleased]: https://github.com/ziki17/no-trace-containers/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/ziki17/no-trace-containers/releases/tag/v0.1.0
