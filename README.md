# node-zip-cli
Simple NodeJS CLI which allows you zip and unzip files with support for .gitignore files

![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/matteosacchetto/node-zip-cli?label=latest%20release&style=for-the-badge)

## Install

### Latest version

Install it locally with

```bash
npm i https://github.com/matteosacchetto/node-zip-cli/releases/download/v0.4.1/node-zip-cli-0.4.1.tgz
```

Or install it globally with

```bash
npm i --location=global https://github.com/matteosacchetto/node-zip-cli/releases/download/v0.4.1/node-zip-cli-0.4.1.tgz
```

### Other version

Go to the [release](https://github.com/matteosacchetto/node-zip-cli/releases) section of the GitHub repository

Copy the link the node-zip-cli-{version}.tgz

Install it locally with

```bash
npm i <link-to-node-zip-cli-{version}.tgz>
```

Or install it globally with

```bash
npm i --location=global <link-to-node-zip-cli-{version}.tgz>
```

where you have to replace `{version}` with the version number you downloaded (ex: 0.1.5) 

### Bash completion

Since version 0.2.0, the package also includes a bash completion script. If you install the package globally, you are on Linux and you use bash as your main shell, I highly suggest installing bash completion, as it improves the UX of this module.

To install it, i recommend to perform the following steps.

Find where did npm isntall this package. To do so you can run the following command

```bash
npm list -g -p | grep node-zip-cli
```

Then we can link `bash-completion.sh` script contained within the folder shown by the previous command to /usr/share/bash-completion/completions/node-zip-cli

```bash
ln -s <path-found-previously>/bash-completion.sh /usr/share/bash-completion/completions/node-zip-cli
```

One-liner to do so

```bash
sudo ln -s `npm list -g -p | grep -m 1 node-zip-cli`/bash-completion.sh /usr/share/bash-completion/completions/node-zip-cli
```

To remove the completion file

```bash
sudo rm /usr/share/bash-completion/completions/node-zip-cli
```

You can alternatively install bash completion locally with the following commands

```bash
mkdir -p ~/.local/share/bash-completion/completions
ln -s `npm list -g -p | grep -m 1 node-zip-cli`/bash-completion.sh ~/.local/share/bash-completion/completions/node-zip-cli
```

To remove it 

```bash
rm ~/.local/share/bash-completion/completions/node-zip-cli
```

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
  -e, --exclude <paths...>           ignore the following paths
  --allow-git                        allow .git to be included in the zip (default: false)
  --dry-run                          lists the files that will be zipped WITHOUT creating the zip file (default: false)
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

###### `-e, --exclude` (experimental)

Allows you to specify paths that you want to exclude. This option follows the same syntax and rules of the traditional .gitignore file.

**NOTE**: the specified paths must be specified considering as root directory the input directory specified with the `-i` flag

Example:
If you have the following structure and you want to ignore the file `two`, if you run the command with `-i test/`, you need to exclude it with `-e two` and NOT `-e test/two`
```
test/
├── one
├── two
└── three
```

> [!NOTE]
> Up to the current version (0.4.1) the list of paths to ignore which are specified with this options are applied after default ignore paths (like `.git`) BUT before any .gitignore or .zipignore file. This means that paths you specify here could be overridden by the aforementioned files.

###### `--allow-git`

Starting from version `0.2.0`, the directory `.git` is ignored by default. Use this flag if you want instead to include the `.git` directory in your zip file

###### `--dry-run`

Prints the files that will be zipped, without creating the zip file. The structure that is printed out is the same structure of files and directories which will be created in the zip file.

#### `unzip`

Allows you to unzip the content of a zip file to a directory which will be created if non existing

```
Usage: node-zip-cli unzip [options]

Unzip the content of a zip file

Options:
  -v, --version          output the version number
  -i, --input <file>     the input zip file to unzip
  -o, --output <output>  the output directory where to store the zip content (default: ".")
  --dry-run              lists the files that will be unzipped WITHOUT unzipping the archive (default: false)
  -h, --help             display help for command
```

##### Options

###### `-i, --input <file>`

The input zip file to unzip. This option is REQUIRED

###### `-o, --output <output>`

The directory where to store the content of the zip file. Defaults to the current directory

###### `--dry-run`

Prints the files that will be unzipped, without extracting them from the zip file. The structure that is printed out is the same structure of files and directories which will be created when unzipping the zip file.

### Usage

Simply run this CLI providing to each command all the necessary options.

### .zipignore

This file is meant to be placed in a folder which you plan to zip. It is meant to be used instead of the .gitignore, if the content of the folder is not related to git, or as an extension of the .gitignore, where you can specify additional rules related only to the zip file creation. The .zipignore file follow the same syntax and rules of the traditional .gitignore

> [!NOTE]
> Up to the current version (0.4.1) the .zipignore builds on top of already existing .gitignore rules, so if you only want to ignore some additional files you **do not need** to copy paste the content of the .gitignore. Keep in mind that this behavior may change in the future
