# easy-replace-in-files

Find and replace in files via a config file. Supports globs, regex, and placeholders (`$$ENV_VAR$$`, `$$package__version$$`).

## Install

```sh
npm install --save-dev easy-replace-in-files
```

## Usage

Add `easy-replace-in-files.json` in your project root:

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

**`--verbose`** — Log each rule and succeeded/skipped/failed counts.
