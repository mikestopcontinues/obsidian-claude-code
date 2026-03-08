# Claude Code Terminal for Obsidian

Run [Claude Code](https://docs.anthropic.com/en/docs/claude-code) directly inside Obsidian. Opens a fully interactive terminal in a new editor tab — right where you work.

![Desktop Only](https://img.shields.io/badge/desktop-only-blue)

## Features

- **Runs in the vault directory** — Claude Code launches with your vault as the working directory, so it can read and edit your notes directly.
- **Multiple sessions** — Open as many Claude Code tabs as you want. Each runs independently.
- **Pinned tabs** — Claude Code tabs never get replaced when you click files in the explorer. Navigation always opens a new tab.
- **Session persistence** — Conversations survive across app restarts. Close Obsidian, reopen it, and pick up right where you left off.
- **Theme-aware terminal** — Colors, font family, and font size are pulled from your Obsidian settings at launch. Light mode, dark mode, custom themes — it all matches.
- **Font ligatures** — Ligatures are enabled automatically. If your monospace font supports them (Fira Code, JetBrains Mono, etc.), they just work.
- **Centered layout** — The terminal has a max width of 90ch and centers in the pane for comfortable reading.
- **Full terminal emulation** — Powered by xterm.js with proper PTY support via node-pty. Colors, cursor movement, scrollback, interactive input — everything works.
- **Vault-aware permissions** — Read, write, search, and agent tools are pre-allowed within the vault. Web access is enabled by default. User settings from `~/.claude/settings.json` are loaded automatically.
- **Obsidian skill support** — The system prompt encourages use of `/obsidian` skills for vault-aware operations and tells the model how to install them.

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
