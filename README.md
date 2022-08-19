# easy-replace-in-files

> Simple tool for find and replace in files. Uses config file for files, from and to rules.

## Install

```sh
npm install --save-dev easy-replace-in-files
```

## Example

Create config file `easy-replace-in-files.json`

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

In `package.json` scripts

```json
"scripts" : {
  "version": "easy-replace-in-files",
}
```

In the terminal, run

```sh
npm run version
```
