import { createCommand } from '@/lib/command';

import { createWriteStream } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, relative } from 'node:path';
import { scanFs } from '@/lib/scan-fs';
import { exists, isDirectory } from '@/utils/fs';
import {
  getFilename,
  isChildOfCurrentDir,
  printfileListAsFileTree,
} from '@/utils/path';
import {
  exit_fail_on_error,
  exit_success_on_error_ignore,
} from '@/utils/process';
import { validation_spinner } from '@/validation/validation-spinner';
import { valid_zip_file_path } from '@/validation/zip';
import confirm from '@inquirer/confirm';
import chalk from 'chalk';
import { InvalidArgumentError } from 'commander';
import figureSet from 'figures';
import JSZip from 'jszip';
import ora from 'ora';
import isValidFilename from 'valid-filename';

const name = 'zip';
const description =
  'zip files and directories ignoring files specified in .zipignore and .gitignore';

const zipCommand = createCommand(name, description)
  .option('-i, --input <input...>', 'the files or directories to zip', [
    '.',
  ] as string[])
  .option(
    '-d, --deflate <compression-level>',
    'deflate the files',
    (compressionLevel) => {
      const parsedValue = Number.parseInt(compressionLevel, 10);
      if (parsedValue < 0 || parsedValue > 9) {
        throw new InvalidArgumentError(
          'compression level must be a integer number between 0 (no compression) and 9 (maximum compression)'
        );
      }
      return parsedValue;
    },
    0
  )
  .option(
    '-o, --output <output-file>',
    'the filename of the zip file to create',
    'out.zip'
  )
  .option('-y, --yes', 'answers yes to every question', false)
  .option('-e, --exclude <paths...>', 'ignore the following paths')
  .option('--allow-git', 'allow .git to be included in the zip', false)
  .option(
    '--dry-run',
    'lists the files that will be zipped WITHOUT creating the zip file',
    false
  );

zipCommand.action(async (options) => {
  await exit_fail_on_error(async () => {
    const uniqueEntries = [...new Set(options.input)];

    // Validation step
    await validation_spinner({
      name: 'output path',
      value: options.output,
      fn: async () => valid_zip_file_path(options.output),
    });

    if (!options.yes && !options.dryRun) {
      if (await exists(options.output)) {
        const overwrite = await exit_success_on_error_ignore(
          async () =>
            await confirm({
              default: false,
              message: `The file ${options.output} already exists, overwrite it?`,
            })
        );

        if (!overwrite) {
          return;
        }
      }
    }

    try {
      const zip = new JSZip();
      const files = [];
      for (const entry of uniqueEntries) {
        if (!(await isChildOfCurrentDir(entry))) {
          throw Error(
            `${chalk.red(
              figureSet.cross
            )} ${entry} is not child of the current directory`
          );
        }
        if (await isDirectory(entry)) {
          const defaultRules = [];
          if (!options.allowGit) {
            defaultRules.push('.git/');
          }

          if (options.exclude && options.exclude.length > 0) {
            defaultRules.push(...options.exclude);
          }

          files.push(
            ...(await scanFs(entry, defaultRules)).map((el) =>
              relative(process.cwd(), el)
            )
          );
        } else {
          files.push(relative(process.cwd(), entry));
        }
      }

      if (options.dryRun) {
        if (files.length > 0) {
          printfileListAsFileTree(files);
        } else {
          console.error('Nothing to zip');
        }

        return;
      }

      const spinner = ora(`Reading (0/${files.length} files)`);

      if (files.length > 0) {
        try {
          let i = 0;
          spinner.start();
          for (const file of files) {
            spinner.text = `Reading (${++i}/${files.length} files) ${chalk.dim(
              `[${file}]`
            )}`;
            const content = await readFile(file);
            zip.file(file, content);
          }
          i = 0;

          spinner.text = `Creating ${options.output} file (0/${files.length} files)`;

          await mkdir(dirname(options.output), { recursive: true });

          let lastFile = '';
          zip
            .generateNodeStream(
              {
                type: 'nodebuffer',
                streamFiles: true,
                compression: options.deflate ? 'DEFLATE' : 'STORE',
                compressionOptions: {
                  level: options.deflate,
                },
              },
              (metadata) => {
                if (
                  metadata.currentFile &&
                  isValidFilename(getFilename(metadata.currentFile)) &&
                  lastFile !== metadata.currentFile
                ) {
                  lastFile = metadata.currentFile;
                  i++;
                  spinner.text = `Creating ${options.output} file (${i}/${
                    files.length
                  } files) ${chalk.dim(`[${metadata.currentFile}]`)}`;
                }
              }
            )
            .pipe(createWriteStream(options.output))
            .on('error', (e) => {
              spinner.fail();
              console.error(e);
            })
            .on('finish', () => {
              spinner.succeed(
                `Created ${options.output} file (${i}/${files.length} files)`
              );
            });
        } catch (e) {
          spinner.fail();
          if (e instanceof Error) console.error(e.message);
          else console.error(e);
        }
      } else {
        console.error(
          `${chalk.yellow.bold(figureSet.arrowDown)} Creating ${
            options.output
          } file ${chalk.dim('[SKIPPED]')}`
        );
        console.error('Nothing to zip');
      }
    } catch (e) {
      if (e instanceof Error) console.error(e.message);
      else console.error(e);
    }
  });
});

export default zipCommand;
