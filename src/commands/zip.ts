import { createCommand } from '@/lib/command';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { list_entries } from '@/lib/scan-fs';
import { logger } from '@/logger';
import { exists, unique_entries } from '@/utils/fs';
import { getFilename, printfileListAsFileTree } from '@/utils/path';
import {
  exit_fail_on_error,
  exit_success_on_error_ignore,
} from '@/utils/process';
import { validation_spinner } from '@/validation/validation-spinner';
import { valid_zip_file_path } from '@/validation/zip';
import { createOption } from '@commander-js/extra-typings';
import confirm from '@inquirer/confirm';
import chalk from 'chalk';
import { InvalidArgumentError } from 'commander';
import figureSet from 'figures';
import JSZip from 'jszip';
import ora from 'ora';
import isValidFilename from 'valid-filename';
import { log_indent } from '@/utils/log';

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
  .addOption(
    createOption('-k, --keep-parent <mode>', 'keep the parent directories')
      .choices(['none', 'last', 'full'] as const)
      .default('full' as const)
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
    const uniqueEntries = unique_entries(options.input);

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

    const [unique_files, conflicting_list] = await list_entries(
      uniqueEntries,
      options.keepParent,
      options.allowGit,
      options.exclude
    );

    if (conflicting_list.length) {
      logger.warning(
        chalk.bold('The following list of entries conflicts with other entries')
      );
      for (const entry of conflicting_list) {
        logger.log(
          `${chalk.yellow(entry.conflicting_path)} -> ${chalk.green(
            entry.conflicting_with_path
          )}`
        );
      }

      if (!options.yes) {
        const proceed = await exit_success_on_error_ignore(
          async () =>
            await confirm({
              default: false,
              message: `Proceed anyway? ${chalk.dim(
                '(conflicting files will not be added)'
              )}`,
            })
        );

        if (!proceed) {
          return;
        }
      } else {
        logger.info('Creating the archive excluding those files');
      }
    }

    if (options.dryRun) {
      if (unique_files.length > 0) {
        printfileListAsFileTree(unique_files);
      } else {
        console.error('Nothing to zip');
      }

      return;
    }

    const zip = new JSZip();
    const num_files = unique_files.filter((el) => el.type === 'file').length;
    const spinner = ora(`Reading (0/${num_files} files)`);

    if (num_files > 0) {
      try {
        let i = 0;
        spinner.start();
        for (const file of unique_files) {
          if (file.type === 'file') {
            spinner.text = `Reading (${++i}/${num_files} files) ${chalk.dim(
              `[${file}]`
            )}`;
            zip.file(file.cleaned_path, createReadStream(file.path), {
              date: file.stats.mtime,
              unixPermissions: file.stats.mode,
            });
          } else if (file.type === 'directory') {
            zip.file(file.cleaned_path, null, {
              date: file.stats.mtime,
              unixPermissions: file.stats.mode,
              dir: true,
            });
          }
        }
        i = 0;

        spinner.text = `Creating ${options.output} file (0/${num_files} files)`;

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
                spinner.text = `Creating ${
                  options.output
                } file (${i}/${num_files} files) ${chalk.dim(
                  `[${metadata.currentFile}]`
                )}`;
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
              `Created ${options.output} file (${i}/${num_files} files)`
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
      log_indent({
        indentation_increment: 2,
        fn: () => {
          logger.dimmed_error('Nothing to zip');
        },
      });
    }
  });
});

export default zipCommand;
