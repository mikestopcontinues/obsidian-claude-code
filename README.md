# Claude Code Terminal for Obsidian

Run [Claude Code](https://docs.anthropic.com/en/docs/claude-code) directly inside Obsidian. Opens a fully interactive terminal in a new editor tab — right where you work.

![Desktop Only](https://img.shields.io/badge/desktop-only-blue)

## Features

- **Runs in the vault directory** — Claude Code launches with your vault as the working directory, so it can read and edit your notes directly.
- **Multiple sessions** — Open as many Claude Code tabs as you want. Each runs independently.
- **Session persistence** — Conversations survive across app restarts. Close Obsidian, reopen it, and pick up right where you left off.
- **Theme-aware terminal** — Colors are pulled from your active Obsidian theme at launch. Light mode, dark mode, custom themes — it all matches.
- **Full terminal emulation** — Powered by xterm.js with proper PTY support via node-pty. Colors, cursor movement, scrollback, interactive input — everything works.

## Requirements

- **Desktop only** — This plugin uses native Node.js APIs and cannot run on mobile.
- **Claude Code** must be installed: `npm install -g @anthropic-ai/claude-code`
- **macOS or Linux** — Windows support is untested.

## Installation

### From Community Plugins (coming soon)

Search for "Claude Code Terminal" in Obsidian's community plugin browser.

### Manual

1. Clone this repo into your vault's plugin directory:
   ```bash
   cd /path/to/vault/.obsidian/plugins
   git clone https://github.com/mikestopcontinues/obsidian-claude-code.git claude-code-terminal
   cd claude-code-terminal
   ```

2. Install dependencies and build:
   ```bash
   npm run setup
   ```
   This installs packages, rebuilds `node-pty` for Obsidian's Electron version, and compiles the plugin.

3. Restart Obsidian, then enable "Claude Code Terminal" in Settings → Community Plugins.

## Usage

- **Command palette:** `Claude Code Terminal: Open Claude Code`
- **Default hotkey:** `Cmd+Shift+Esc` (customizable in Obsidian's hotkey settings)

Each invocation opens a new tab. Tabs persist in your workspace layout and restore their Claude Code session on restart.

## Configuration

The plugin looks for the `claude` binary in this order:

1. `CLAUDE_PATH` environment variable
2. `/opt/homebrew/bin/claude`
3. `/usr/local/bin/claude`
4. `which claude`

If Claude Code is installed globally, it should be found automatically.

## Development

```bash
git clone https://github.com/mikestopcontinues/obsidian-claude-code.git
cd obsidian-claude-code
npm run setup
npm run dev    # watch mode
```

Symlink the repo into your vault's plugin directory for development:

```bash
ln -s /path/to/obsidian-claude-code /path/to/vault/.obsidian/plugins/claude-code-terminal
```

### Rebuilding node-pty

If Obsidian updates its Electron version, you may need to rebuild node-pty:

```bash
npm run rebuild-pty
```

## License

[MIT](LICENSE)
