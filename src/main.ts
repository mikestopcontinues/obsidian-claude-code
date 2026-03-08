import { Plugin, ItemView, WorkspaceLeaf } from "obsidian";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import * as path from "path";
import * as crypto from "crypto";
import { execSync } from "child_process";

const VIEW_TYPE = "claude-code-terminal";

function findClaude(): string {
  const candidates = [
    process.env.CLAUDE_PATH,
    "/opt/homebrew/bin/claude",
    "/usr/local/bin/claude",
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    try {
      require("fs").accessSync(p, require("fs").constants.X_OK);
      return p;
    } catch {
      // not found, try next
    }
  }

  // Fall back to which/where
  try {
    const result = execSync("which claude", { encoding: "utf8" }).trim();
    if (result) return result;
  } catch {
    // not found
  }

  throw new Error(
    "Claude Code not found. Install it with: npm install -g @anthropic-ai/claude-code"
  );
}

function requireNodePty(pluginDir: string): any {
  const ptyPath = path.join(pluginDir, "node_modules", "node-pty");
  return require(ptyPath);
}

interface ClaudeCodeState {
  sessionId?: string;
}

class ClaudeCodeView extends ItemView {
  private terminal: Terminal | null = null;
  private fitAddon: FitAddon | null = null;
  private ptyProcess: any = null;
  private resizeObserver: ResizeObserver | null = null;
  private sessionId: string | null = null;
  private isResuming = false;

  constructor(
    leaf: WorkspaceLeaf,
    private vaultPath: string,
    private pluginDir: string,
  ) {
    super(leaf);
  }

  navigation = true;

  getViewType(): string {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Claude Code";
  }

  getIcon(): string {
    return "terminal";
  }

  getState(): Record<string, unknown> {
    const state = super.getState() as Record<string, unknown>;
    if (this.sessionId) {
      state.sessionId = this.sessionId;
    }
    return state;
  }

  async setState(state: ClaudeCodeState, result: any): Promise<void> {
    if (state.sessionId) {
      this.sessionId = state.sessionId;
      this.isResuming = true;
    }
    await super.setState(state, result);
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("claude-code-terminal-container");

    const terminalEl = container.createDiv({ cls: "claude-code-terminal" });

    this.fitAddon = new FitAddon();
    this.terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily:
        "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, monospace",
      theme: this.getObsidianTheme(),
      allowProposedApi: true,
      scrollback: 10000,
    });

    this.terminal.loadAddon(this.fitAddon);
    this.terminal.attachCustomKeyEventHandler((e: KeyboardEvent) => {
      // Prevent Escape from bubbling to Obsidian (which would
      // steal focus from the terminal on the second press).
      if (e.key === "Escape") {
        e.stopPropagation();
        return true;
      }
      // Shift+Enter / Alt+Enter: send kitty-protocol sequences.
      // Block all event types (keydown, keypress, keyup) to prevent
      // xterm from also sending a bare \r on keypress.
      if (e.key === "Enter" && (e.shiftKey || e.altKey)) {
        if (e.type === "keydown") {
          this.ptyProcess?.write(
            e.shiftKey ? "\x1b[13;2u" : "\x1b[13;3u",
          );
        }
        return false;
      }
      // Cmd+Left/Right → Home/End
      if (e.metaKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        if (e.type === "keydown") {
          this.ptyProcess?.write(
            e.key === "ArrowLeft" ? "\x1bOH" : "\x1bOF",
          );
        }
        return false;
      }
      return true;
    });
    this.terminal.open(terminalEl);

    setTimeout(() => {
      this.fitAddon?.fit();
      this.terminal?.focus();
      this.spawnClaude();
    }, 100);

    this.resizeObserver = new ResizeObserver(() => {
      this.fitAddon?.fit();
      if (this.ptyProcess && this.terminal) {
        try {
          this.ptyProcess.resize(this.terminal.cols, this.terminal.rows);
        } catch {
          // ignore resize errors
        }
      }
    });
    this.resizeObserver.observe(terminalEl);
  }

  private spawnClaude(): void {
    if (!this.terminal) return;

    let pty: any;
    try {
      pty = requireNodePty(this.pluginDir);
    } catch (e) {
      this.terminal.writeln("\x1b[31mError: node-pty is not available.\x1b[0m");
      this.terminal.writeln(
        "\x1b[33mRun the following in the plugin directory:\x1b[0m",
      );
      this.terminal.writeln(
        "\x1b[36m  cd " + this.pluginDir + "\x1b[0m",
      );
      this.terminal.writeln("\x1b[36m  npm run rebuild-pty\x1b[0m");
      console.error("node-pty load error:", e);
      return;
    }

    let claudePath: string;
    try {
      claudePath = findClaude();
    } catch (e: any) {
      this.terminal.writeln(`\x1b[31m${e.message}\x1b[0m`);
      return;
    }

    const envPath = process.env.PATH || "";
    const extraPaths = "/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin";
    const fullPath = `${extraPaths}:${envPath}`;

    const args: string[] = [];

    if (this.isResuming && this.sessionId) {
      args.push("--resume", this.sessionId);
      this.isResuming = false;
    } else {
      this.sessionId = crypto.randomUUID();
      args.push("--session-id", this.sessionId);
    }

    this.ptyProcess = pty.spawn(claudePath, args, {
      name: "xterm-256color",
      cols: this.terminal.cols,
      rows: this.terminal.rows,
      cwd: this.vaultPath,
      env: {
        ...process.env,
        PATH: fullPath,
        TERM: "xterm-256color",
        COLORTERM: "truecolor",
      },
    });

    this.app.workspace.requestSaveLayout();

    this.ptyProcess.onData((data: string) => {
      this.terminal?.write(data);
    });

    this.ptyProcess.onExit(({ exitCode }: { exitCode: number }) => {
      this.terminal?.writeln(
        `\r\n\x1b[90m[Claude Code exited with code ${exitCode}]\x1b[0m`,
      );
      this.terminal?.writeln(
        "\x1b[90mPress any key to restart, or close this pane.\x1b[0m",
      );
      this.ptyProcess = null;

      const disposable = this.terminal?.onKey(() => {
        disposable?.dispose();
        this.isResuming = true;
        this.spawnClaude();
      });
    });

    this.terminal.onData((data: string) => {
      this.ptyProcess?.write(data);
    });
  }

  async onClose(): Promise<void> {
    this.resizeObserver?.disconnect();
    if (this.ptyProcess) {
      this.ptyProcess.kill();
      this.ptyProcess = null;
    }
    this.terminal?.dispose();
    this.terminal = null;
  }

  private getObsidianTheme(): Record<string, string> {
    const s = getComputedStyle(document.body);
    const v = (prop: string) => s.getPropertyValue(prop).trim();

    const bg = v("--background-primary") || "#1e1e2e";
    const fg = v("--text-normal") || "#cdd6f4";
    const cursor = v("--text-accent") || "#f5e0dc";
    const selection = v("--text-selection") || "#585b7066";

    const red = v("--color-red") || "#f38ba8";
    const green = v("--color-green") || "#a6e3a1";
    const yellow = v("--color-yellow") || "#f9e2af";
    const blue = v("--color-blue") || "#89b4fa";
    const magenta = v("--color-purple") || "#f5c2e7";
    const cyan = v("--color-cyan") || "#94e2d5";
    const muted = v("--text-muted") || "#585b70";
    const faint = v("--text-faint") || "#45475a";

    return {
      background: bg,
      foreground: fg,
      cursor,
      selectionBackground: selection,
      black: faint,
      red,
      green,
      yellow,
      blue,
      magenta,
      cyan,
      white: fg,
      brightBlack: muted,
      brightRed: red,
      brightGreen: green,
      brightYellow: yellow,
      brightBlue: blue,
      brightMagenta: magenta,
      brightCyan: cyan,
      brightWhite: fg,
    };
  }
}

export default class ClaudeCodeTerminalPlugin extends Plugin {
  async onload(): Promise<void> {
    const vaultPath = (this.app.vault.adapter as any).basePath;
    const pluginDir = (this.manifest as any).dir
      ? path.join(vaultPath, (this.manifest as any).dir)
      : path.join(
          vaultPath,
          ".obsidian",
          "plugins",
          "claude-code-terminal",
        );

    this.registerView(
      VIEW_TYPE,
      (leaf) => new ClaudeCodeView(leaf, vaultPath, pluginDir),
    );

    this.addCommand({
      id: "open-claude-code",
      name: "Open Claude Code",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "Escape" }],
      callback: () => this.openNewTab(),
    });
  }

  async openNewTab(): Promise<void> {
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.setViewState({ type: VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
  }
}
