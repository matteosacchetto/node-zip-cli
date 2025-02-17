# node-zip-cli

Simple Node.js CLI which allows you to create and extract zip/tar files with support for .gitignore files

![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/matteosacchetto/node-zip-cli?label=latest%20release&style=for-the-badge)

## Install

### Latest version

Install it locally with

```bash
npm i https://github.com/matteosacchetto/node-zip-cli/releases/download/v0.9.0/node-zip-cli-0.9.0.tgz
```

Or install it globally with

```bash
npm i --location=global https://github.com/matteosacchetto/node-zip-cli/releases/download/v0.9.0/node-zip-cli-0.9.0.tgz
```

### Other versions

Go to the [release](https://github.com/matteosacchetto/node-zip-cli/releases) section of the GitHub repository

Copy the link to node-zip-cli-{version}.tgz

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

Since version 0.2.0, the package also includes a bash completion script. If you install the package globally, you are on Linux, and you use bash as your main shell, I highly suggest installing bash completion, as it improves the UX of this module.

To install it, I recommend performing the following steps.

Find where npm installed this package. To do so, you can run the following command

```bash
npm list -g -p | grep node-zip-cli
```

Then we can link the `bash-completion.sh` script contained within the folder shown by the previous command to /usr/share/bash-completion/completions/node-zip-cli

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

If you installed it locally, you can run it with

```bash
npx node-zip-cli
```

If instead you installed it globally, you can run it with
```bash
node-zip-cli
```

## CLI

```
Usage: node-zip-cli [options] [command]

simple nodejs cli which allows you to create and extract zip/tar files with support for .gitignore files

Options:
  -v, --version    output the version number
  -h, --help       display help for command

Commands:
  zip [options]    zip files and directories ignoring files specified in .zipignore and .gitignore
  unzip [options]  unzip the content of a zip file
  tar [options]    tar files and directories ignoring files specified in .zipignore and .gitignore
  untar [options]  untar the content of a tar file
  find [options]   find files and directories ignoring files specified in .zipignore and .gitignore
  help [command]   display help for command
```

### Commands

#### `zip`

Allows you to create a zip file of the specified files and directories. For each directory, it will also go through it and scan it recursively, ignoring every file and directory listed in the .gitignore and .zipignore files, if present.

```
Usage: node-zip-cli zip [options]

zip files and directories ignoring files specified in .zipignore and .gitignore

Options:
  -v, --version                      output the version number
  -i, --input <input...>             the files or directories to zip (default: ["."])
  -d, --deflate [compression-level]  deflate the files (default: false, preset: 6)
  -o, --output <output-file>         the filename of the zip file to create (default: "out.zip")
  -k, --keep-parent <mode>           keep the parent directories (choices: "none", "last", "full", default: "full")
  -s, --symlink [mode]               handle symlinks (choices: "none", "resolve", "keep", default: "none", preset: "resolve")
  --disable-ignore [mode]            disable some or all ignore rules (choices: "none", "zipignore", "gitignore", "ignore-files",
                                     "exclude-rules", "all", default: "none", preset: "ignore-files")
  -y, --yes                          answers yes to every question (default: false)
  -e, --exclude <paths...>           ignore the following paths
  --allow-git                        allow .git to be included in the zip (default: false)
  --dry-run                          lists the files that will be zipped WITHOUT creating the zip file (default: false)
  -h, --help                         display help for command
```

##### Options

###### `-i, --input <input...>`

Specify the list of input files/directories. Defaults to the current directory (`.`). Files and directories can be relative or absolute paths.

###### `-d, --deflate [compression-level]`

Specify the compression level of the deflate operation. The compression level can be a value between 0 (no compression) and 9 (maximum compression). By default, **no compression** is applied.

If this option is set without any specified compression level, it will fall back to its preset level, which is 6.

###### `-o, --output <output-file>`

Specify the file path of the output zip file. Defaults to out.zip

###### `-k, --keep-parent <mode>`

This option specifies how to store the provided input files/directories. The possible values are `none`, `last` and `full`. These options will do the following:

- `full`: preserve the full path of the provided files/directories. If you provide the path `/a/b/c/`, files will be stored in the archive with the base directory `a/b/c/`.
- `last`: preserve only the last directory of the provided files/directories. If you provide the path `/a/b/c/`, files will be stored in the archive with the base directory `c/`.
- `none`: do not preserve the base directory of the provided file/directory. If you provide the path `/a/b/c/`, files will be stored in the archive with the base directory `.`.

The default value is `full`.

###### `-s, --symlink [mode]`

Allows you to include symlinks in your archive using two different strategies:
* `resolve`: will resolve the symlink to a file or directory and include it in the archive
* `keep`: will keep the symlink and include it in the archive

There is also the option `none` which allows you to skip symlinks altogether.

> [!NOTE]
> Since version (0.10.0) symlink support is marked as stable
>
> The default behavior is to **NOT** include symlinks in the archive, but force the user to decide whether to include them and with which modality. This option supports being enabled without explicitly specifying a mode, in this case the behavior will be that of `resolve`.

###### `--disable-ignore [mode]`

Allows you to skip some ignore rules.
The available modes are:
* `none`: do not skip any rule, so all rules are active
* `zipignore`: do not consider rules in the .zipignore file
* `gitignore`: do not consider rules in the .gitignore file
* `ignore-files`: do not consider rules in the .zipignore and .gitignore files
* `exclude-rules`: do not consider rules specified on the command line, with the option `-e`
* `all`: disable all rules

> [!NOTE]
> Since version (0.10.0) this option supports being enabled without specifying a mode. In this case the behavior will be that of `ignore-files`.

###### `-y, --yes`

Answers yes to every confirmation question

###### `-e, --exclude <paths...>`

Allows you to specify paths that you want to exclude. This option follows the same syntax and rules as the traditional .gitignore file.

> [!WARNING]
> To avoid issues with wildcard extension, remember to put pattern including a wildcard between single or double quotes, to prevent the shell expanding that wildcard. If you do not escape the wildcard the behavior will differ from what you expect.
> 
> For example, providing `*.mjs` will result in the shell replacing it will all the file matching the wildcard, so as the input to the CLI, instead of `"*.mjs"` will be provided the whole list (e.g. "rollup.config.mjs", "test.runner.mjs", ...). Instead, providing `"*.mjs"` will behave as expected, providing as input to the CLI the pattern `"*.mjs"`

> [!NOTE]
> Up to the current version (0.10.0) the list of paths to ignore which are specified with this options are applied after default ignore paths (like `.git`) BUT before any .gitignore or .zipignore file. This means that paths you specify here could be overridden by the aforementioned files.

###### `--allow-git`

Starting from version (0.2.0), the directory `.git` is ignored by default. Use this flag if you want instead to include the `.git` directory in your zip file

###### `--dry-run`

Prints the files that will be zipped, without creating the zip file. The structure that is printed out is the same structure of files and directories tath will be stored in the zip file.

#### `unzip`

Allows you to unzip the content of a zip file to a directory, which will be created if non-existing

```
Usage: node-zip-cli unzip [options]

Unzip the content of a zip file

Options:
  -v, --version          output the version number
  -i, --input <file>     the input zip file to unzip
  -o, --output <output>  the output directory where to store the zip content (default: ".")
  --dry-run              lists the files that will be unzipped WITHOUT unzipping the archive (default: false)
  -y, --yes              answers yes to every question (default: false)
  -h, --help             display help for command
```

##### Options

###### `-i, --input <file>`

The input zip file to unzip. This option is REQUIRED

###### `-o, --output <output>`

The directory where to store the content of the zip file. Defaults to the current directory

###### `-y, --yes`

Answers yes to every confirmation question

###### `--dry-run`

Prints the files that will be unzipped, without extracting them from the zip file. The structure that is printed out is the same structure of files and directories that will be created when unzipping the zip file.

#### `tar`

Allows you to create a tarball file of the specified files and directories. For each directory, it will also go through it and scan it recursively, ignoring every file and directory listed in the .gitignore and .zipignore files, if present.

```
Usage: node-zip-cli tar [options]

tar files and directories ignoring files specified in .zipignore and .gitignore

Options:
  -v, --version                   output the version number
  -i, --input <input...>          the files or directories to tar (default: ["."])
  -g, --gzip [compression-level]  gzip the archive (default: false, preset: 6)
  -o, --output <output-file>      the filename of the tar file to create
  -k, --keep-parent <mode>        keep the parent directories (choices: "none", "last", "full", default: "full")
  -s, --symlink [mode]            handle symlinks (choices: "none", "resolve", "keep", default: "none", preset: "resolve")
  --disable-ignore [mode]         disable some or all ignore rules (choices: "none", "zipignore", "gitignore", "ignore-files",
                                  "exclude-rules", "all", default: "none", preset: "ignore-files")
  -y, --yes                       answers yes to every question (default: false)
  -e, --exclude <paths...>        ignore the following paths
  --allow-git                     allow .git to be included in the tar (default: false)
  --dry-run                       lists the files that will be tarred WITHOUT creating the tar file (default: false)
  -h, --help                      display help for command
```

##### Options

###### `-i, --input <input...>`

Specify the list of input files/directories. Defaults to the current directory (`.`). Files and directories can be relative or absolute paths.

###### `-g, --gzip [compression-level]`

Enable gzip compression and optionally specify the compression level of the gzip operation. The compression level can be a value between 0 (no compression) and 9 (maximum compression). By default, **no compression** is applied.

If this option is set without any specified compression level, it will fall back to its preset level, which is 6.

###### `-o, --output <output-file>`

Specify the file path of the output tar file. Defaults to out.tar (or out.tgz if compression is enabled)

##### `-k, --keep-parent <mode>`

This option specifies how to store the provided input files/directories. The possible values are `none`, `last` and `full`. These options will do the following:

- `full`: preserve the full path of the provided files/directories. If you provide the path `/a/b/c/`, files will be stored in the archive with the base directory `a/b/c/`.
- `last`: preserve only the last directory of the provided files/directories. If you provide the path `/a/b/c/`, files will be stored in the archive with the base directory `c/`.
- `none`: do not preserve the base directory of the provided file/directory. If you provide the path `/a/b/c/`, files will be stored in the archive with the base directory `.`.

The default value is `full`.

###### `-s, --symlink [mode]`

Allows you to include symlinks in your archive using two different strategies:
* `resolve`: will resolve the symlink to a file or directory and include it in the archive
* `keep`: will keep the symlink and include it in the archive

There is also the option `none` which allows you to skip symlinks altogether.

> [!NOTE]
> Since version (0.10.0) symlink support is marked as stable
>
> The default behavior is to **NOT** include symlinks in the archive, but force the user to decide whether to include them and with which modality. This option supports being enabled without explicitly specifying a mode, in this case the behavior will be that of `resolve`.

###### `--disable-ignore [mode]`

Allows you to skip some ignore rules.
The available modes are:
* `none`: do not skip any rule, so all rules are active
* `zipignore`: do not consider rules in the .zipignore file
* `gitignore`: do not consider rules in the .gitignore file
* `ignore-files`: do not consider rules in the .zipignore and .gitignore files
* `exclude-rules`: do not consider rules specified on the command line, with the option `-e`
* `all`: disable all rules

> [!NOTE]
> Since version (0.10.0) this option supports being enabled without explicitly specifying a mode, in this case the behavior will be that of `ignore-files`.

###### `-y, --yes`

Answers yes to every confirmation question

###### `-e, --exclude <paths...>`

Allows you to specify paths that you want to exclude. This option follows the same syntax and rules as the traditional .gitignore file.

> [!WARNING]
> To avoid issues with wildcard extension, remember to put pattern including a wildcard between single or double quotes, to prevent the shell expanding that wildcard. If you do not escape the wildcard the behavior will differ from what you expect.
> 
> For example, providing `*.mjs` will result in the shell replacing it will all the file matching the wildcard, so as the input to the CLI, instead of `"*.mjs"` will be provided the whole list (e.g. "rollup.config.mjs", "test.runner.mjs", ...). Instead, providing `"*.mjs"` will behave as expected, providing as input to the CLI the pattern `"*.mjs"`

> [!NOTE]
> Up to the current version (0.10.0) the list of paths to ignore which are specified with this options are applied after default ignore paths (like `.git`) BUT before any .gitignore or .zipignore file. This means that paths you specify here could be overridden by the aforementioned files.

###### `--allow-git`

Starting from version (0.2.0), the directory `.git` is ignored by default. Use this flag if you want instead to include the `.git` directory in your zip file

###### `--dry-run`

Prints the files that will be zipped, without creating the tarball file. The structure that is printed out is the same structure of files and directories that will be stored in the tarball file.

#### `untar`

Allows you to untar the content of a tar file to a directory, which will be created if non-existing

```
Usage: node-zip-cli untar [options]

untar the content of a tar file

Options:
  -v, --version          output the version number
  -i, --input <file>     the input tar file to untar
  -o, --output <output>  the output directory where to store the tar content (default: ".")
  --dry-run              lists the files that will be untarped WITHOUT untarping the archive (default: false)
  -y, --yes              answers yes to every question (default: false)
  -h, --help             display help for command
```

##### Options

###### `-i, --input <file>`

The input tarball file to untar. This option is REQUIRED

###### `-o, --output <output>`

The directory where to store the content of the tarball file. Defaults to the current directory

###### `-y, --yes`

Answers yes to every confirmation question

###### `--dry-run`

Prints the files that will be untarred, without extracting them from the tarball file. The structure that is printed out is the same structure of files and directories that will be created when untarring the tarball file.

#### `find`

Allows you to list recursively the content of files and directories, ignoring files specified in .zipignore and .gitignore

The idea of this command is to be a simple alternative to find when you want to list the directories and pipe the output to native commands (e.g., `zip`, `tar`, `tree`, ...).

Example usage with `zip`
```bash
node-zip-cli find | zip <archive name> -@
```

Example usage with `tar`
```bash
node-zip-cli find | tar --no-recursion -czf <archive> -T -
```

Example usage with `tree`
```bash
node-zip-cli find | tree -U --fromfile
```

```
Usage: node-zip-cli find [options]

find files and directories ignoring files specified in .zipignore and .gitignore

Options:
  -v, --version             output the version number
  -i, --input <input...>    the files or directories to zip (default: ["."])
  -t, --type <type...>      filter printed entries (f: file, d: directory, l: symlink) (choices: "f", "d", "l", default: ["f","d","l"])
  -s, --symlink [mode]      handle symlinks (choices: "none", "keep", default: "none", preset: "keep")
  --disable-ignore [mode]   disable some or all ignore rules (choices: "none", "zipignore", "gitignore", "ignore-files",
                            "exclude-rules", "all", default: "none", preset: "ignore-files")
  -e, --exclude <paths...>  ignore the following paths
  --allow-git               allow .git to be included in the zip (default: false)
  --no-colors               do not colorize the output
  -h, --help                display help for command
```

##### Options

###### `-i, --input <input...>`

Specify the list of input files/directories. Defaults to the current directory (`.`). Files and directories can be relative or absolute paths.

###### `-t, --type <type...>`

Filter the types of entries this command will list
- f: files
- d: directories
- l: symlinks

By default, the three types are included, but you can decide to only list a subset.

> [!NOTE]
> Up to the current version (0.10.0) symlinks are not listed by default. To list them you need to specify the `-s keep` option.
>
> Since version (0.10.0) to list them you can just specify the `-s` option

###### `-s, --symlink [mode]`

Allows you to include symlinks in your entry list according to the following strategy:
* `keep`: will keep the symlink and include it in the list

There is also the option `none` which allows you to skip symlinks altogether.

> [!NOTE]
> Since version (0.10.0) symlink support is marked as stable
>
> The default behavior is to **NOT** list symlinks, but force the user to explicitly enable this option to list them. This option supports being enabled without explicitly specifying a mode, in this case the behavior will be that of `keep`.

###### `--disable-ignore [mode]`

Allows you to skip some ignore rules.
The available modes are:
* `none`: do not skip any rule, so all rules are active
* `zipignore`: do not consider rules in the .zipignore file
* `gitignore`: do not consider rules in the .gitignore file
* `ignore-files`: do not consider rules in the .zipignore and .gitignore files
* `exclude-rules`: do not consider rules specified on the command line, with the option `-e`
* `all`: disable all rules

> [!NOTE]
> Since version (0.10.0) this option supports being enabled without explicitly specifying a mode, in this case the behavior will be that of `ignore-files`.

###### `-e, --exclude <paths...>`

Allows you to specify paths that you want to exclude. This option follows the same syntax and rules as the traditional .gitignore file.

> [!WARNING]
> To avoid issues with wildcard extension, remember to put pattern including a wildcard between single or double quotes, to prevent the shell expanding that wildcard. If you do not escape the wildcard the behavior will differ from what you expect.
> 
> For example, providing `*.mjs` will result in the shell replacing it will all the file matching the wildcard, so as the input to the CLI, instead of `"*.mjs"` will be provided the whole list (e.g. "rollup.config.mjs", "test.runner.mjs", ...). Instead, providing `"*.mjs"` will behave as expected, providing as input to the CLI the pattern `"*.mjs"`

> [!NOTE]
> Up to the current version (0.10.0) the list of paths to ignore which are specified with this options are applied after default ignore paths (like `.git`) BUT before any .gitignore or .zipignore file. This means that paths you specify here could be overridden by the aforementioned files.

###### `--allow-git`

Starting from version (0.2.0), the directory `.git` is ignored by default. Use this flag if you want instead to include the `.git` directory in your list

###### `--no-colors`

By default, this command will colorize each entry based on the terminal support and if the stdout is a TTY.

This option allows you to disable colors altogether.

### Usage

Simply run this CLI providing to each command all the necessary options.

### .zipignore

This file is meant to be placed in a folder that you plan to zip/tar. It is meant to be used instead of the .gitignore, if the content of the folder is not related to git, or as an extension of the .gitignore, where you can specify additional rules related only to the zip file creation. The .zipignore file follows the same syntax and rules as the traditional .gitignore

> [!NOTE]
> Up to the current version (0.10.0) the .zipignore builds on top of already existing .gitignore rules, so if you only want to ignore some additional files you **do not need** to copy paste the content of the .gitignore.

> [!NOTE]
> Since version (0.7.0) the strategy of ignoring everythin (`*`) and then un-ignoring (!) some paths (e.g. `!test`, `!src`, ...) is supported and behaves like in the gitignore specs. Quoting from [gitignore specs](https://git-scm.com/docs/gitignore): *"It is not possible to re-include a file if a parent directory of that file is excluded. Git doesn’t list excluded directories for performance reasons, so any patterns on contained files have no effect, no matter where they are defined. "*.
>
> For the same performance reasons and to match git behavior, node-zip-cli doesn’t list excluded directories

> [!NOTE]
> Since version (0.8.0) 32-bit and 64-bit zip archives are supported.
>
> Since version (0.9.0) the `mtime` of zip entries is stored with the additional Info-ZIP format, which ensures gretarer precision (rounded to 1 second), and the timezone is specified as always UTC. Refer to the [`yazl` documentation](https://github.com/thejoshwolfe/yazl) for additional details regarding such format.

> [!WARNING]
> *Current limitations*  
> Up to the current version (0.10.0) zip/tar and unzip/untar handle files, directories and symlinks.
>
> Since version (0.10.0) symlink support is marked as stable, but requires the user to explicitly enable it for `zip`,`tar` and `find` through the `-s, --symlink` option.