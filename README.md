# No Trace Containers

A Firefox extension that disables browsing history for chosen containers. Optionally clears cookies for those containers when their last tab closes.

Built because [`xieve/no-history-containers`](https://gitlab.com/xieve/no-history-containers) is unmaintained and was broken on recent Firefox.

## What it does

- Pick which Firefox containers should leave no browsing history.
- Pages opened in those containers are removed from history as you browse and again when the tab closes.
- (Optional) When the last tab of a blocked container closes, its cookies are wiped too.
- Default container and non-container tabs are never touched.

## Requirements

- Firefox 140+
- Container Tabs enabled: `about:preferences#tabs` → **Enable Container Tabs**
- "Remember history" mode (does not work in always-private-browsing mode — there is no history to delete)

## Install (developer / temporary)

1. Clone this repo.
2. In Firefox, open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and pick the `manifest.json` in the project root.
4. Click the extension icon → **Manage all containers** → check the containers you want history disabled for.

Temporary add-ons disappear when Firefox restarts. To make it persistent you can either:

- Sign and host an `.xpi` yourself (see [Mozilla's self-distribution docs](https://extensionworkshop.com/documentation/publish/self-distribution/)).
- Submit it to AMO for a permanent signed version.

## Build a packaged `.xpi`

```bash
npm install
npm run build
# Produces dist/no_trace_containers-0.1.0.zip — rename to .xpi for distribution
```

## Develop

```bash
npm install
npm run start    # launches a fresh Firefox profile with the extension loaded
npm run lint     # runs web-ext lint
```

## Permissions explained

| Permission             | Why                                                             |
| ---------------------- | --------------------------------------------------------------- |
| `history`              | Delete URLs from history for blocked containers                 |
| `tabs`                 | Inspect a tab's `cookieStoreId` (which container it belongs to) |
| `webNavigation`        | Detect when a page commits/completes to delete its history      |
| `contextualIdentities` | Enumerate containers in the options page                        |
| `cookies`              | Clear container cookies on tab close (only if you opt in)       |
| `storage`              | Persist your settings                                           |
| `<all_urls>`           | Required for `history.deleteUrl` to apply to any site           |

## Known limitations

- History deletion races with Firefox's history writer. We delete on both `onCommitted` and `onCompleted` plus again when the tab closes; some sub-resource URLs may still slip through in rare cases.
- Does not affect `places.sqlite`'s session restore or downloaded files.
- "Always use private browsing" mode bypasses this extension by design — there is no persistent history to delete.

## License

MIT — see [`LICENSE`](LICENSE).

## Contributing

Issues and PRs welcome. Keep changes minimal — the goal is a small, dependable extension, not a feature pile.
