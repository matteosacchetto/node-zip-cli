# node-zip-cli
Simple NodeJS CLI which allows you zip and unzip files with support for .gitignore files

![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/matteosacchetto/node-zip-cli?label=latest%20release&style=for-the-badge)

## Install

Go to the [release](https://github.com/matteosacchetto/node-zip-cli/releases) section of the GitHub repository

Download the node-zip-cli-{version}.tgz

Install it locally with

```bash
npm i node-zip-cli-{version}.tgz
```

Or install it globally with

```bash
npm i --location=global node-zip-cli-{version}.tgz
```

where you have to replace `{version}` with the version number you downloaded (ex: 0.1.5) 

## Run

If you installed it locally you can run it with

```bash
npx node-zip-cli
```

If instead you installed it globally you can run it with
```bash
node-zip-cli
```

## CLI interface

```
Usage: node-zip-cli [options] [command]

Options:
  -v, --version    output the version number
  -h, --help       display help for command

Commands:
  zip [options]    zip files and directories ignoring files specified in .zipignore and .gitignore
  unzip [options]  unzip the content of a zip file
  help [command]   display help for command
```

### Commands

#### `zip`

Allows you to create a zip file of the specified files and directories. For each directory it will also go through it and scan recursively it ignoring every file and directory listed in the .gitignore and .zipignore files, if present.

```
Usage: node-zip-cli zip [options]

zip files and directories ignoring files specified in .zipignore and .gitignore

Options:
  -v, --version                      output the version number
  -i, --input <input...>             the files or directories to zip (default: ["."])
  -d, --deflate <compression-level>  deflate the files (default: 0)
  -o, --output <output-file>         the filename of the zip file to create (default: "out.zip")
  -y, --yes                          answers yes to every question (default: false)
  -h, --help                         display help for command
```

##### Options

###### `-i, --input <input...>`

Specify the list of input files/directories. Defaults to the current directory

###### `-d, --deflate <compression-level>`

Specify the compression level of the deflate operation. The compression level can be a value between 0 (no compression) and 9 (maximum compression). Defaults to 0

###### `-o, --output <output-file>`

Specify the filename of the zip file. Defaults to out.zip

###### `-y, --yes`

Answers yes to every confirmation question

#### `unzip`

Allows you to unzip the content of a zip file to a directory which will be created if non existing

```
Usage: node-zip-cli unzip [options]

Unzip the content of a zip file

Options:
  -v, --version          output the version number
  -i, --input <file>     the input zip file to unzip
  -o, --output <output>  the output directory where to store the zip content (default: ".")
  -h, --help             display help for command
```

##### Options

###### `-i, --input <file>`

The input zip file to unzip. This option is REQUIRED

###### `-o, --output <output>`

The directory where to store the content of the zip file. Defaults to the current directory

### Usage

Simply run this CLI providing to each command all the necessary options.

### .zipignore

This file is meant to be placed in a folder which you plan to zip. It is meant to be used instead of the .gitignore, if the content of the folder is not related to git, or as an extension of the .gitignore, where you can specify additional rules related only to the zip file creation. The .zipignore file follow the same syntax and rules of the traditional .gitignore

> **NOTE**: Up to the current version (0.1.5) the .zipignore builds on top of already existing .gitignore rules, so if you only want to ignore some additional files you **do not need** to copy paste the content of the .gitignore. Keep in mind that this behavior may change in the future
