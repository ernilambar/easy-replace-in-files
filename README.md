# easy-replace-in-files

Find and replace in files via a config file. Supports globs, regex, and placeholders (`$$ENV_VAR$$`, `$$package__version$$`).

**Requires Node 20+.**

## Install

```sh
npm install --save-dev easy-replace-in-files
```

## Usage

Add `easy-replace-in-files.json` (or the shorter `easy-replace.json`) in your project root. If both exist, `easy-replace-in-files.json` is used. Each rule has `files`, `from`, and `to`; `type` defaults to `"string"`. Rule shape: `files` (string or array of strings), `from` (string or array), `to` (string or array), `type` (`"string"` or `"regex"`).

### Basic example

```json
{
  "easyReplaceInFiles": [
    {
      "files": "readme.txt",
      "from": "Stable tag:\\s?(.+)",
      "type": "regex",
      "to": "Stable tag: $$npm_package_version$$"
    }
  ]
}
```

Run via script (e.g. in `package.json`: `"version": "easy-replace-in-files"`):

```sh
npm run version
```

### Advanced example

Regex, multiple files/globs, multiple from/to, and placeholders (`$$ENV_VAR$$`, `$$package__version$$`):

```json
{
  "easyReplaceInFiles": [
    {
      "files": "readme.txt",
      "from": "Stable tag:\\s?(.+)",
      "type": "regex",
      "to": "Stable tag: $$package__version$$"
    },
    {
      "files": ["src/index.js", "src/utils.js"],
      "from": "OLD_STRING",
      "to": "NEW_STRING"
    },
    {
      "files": "dist/**/*.js",
      "from": ["__BUILD_DATE__", "__BUILD_ENV__"],
      "to": ["$$BUILD_DATE$$", "$$NODE_ENV$$"]
    }
  ]
}
```

### Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Show which files would be changed without writing. Use with `--verbose` to list each file per rule. |
| `--verbose` | Log each rule and succeeded/skipped/failed counts. |
| `--config <path>` | Use a custom config file (default: `easy-replace-in-files.json` or `easy-replace.json` in the current directory, first found). Requires a path (e.g. `--config my.json`); exits with error if missing. |
| `--help`, `-h` | Show usage and options. |
| `--version`, `-v` | Show version and exit. |

## License

[MIT](https://opensource.org/licenses/MIT)
