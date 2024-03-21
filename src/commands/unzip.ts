import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createCommand } from '@/lib/command';
import { exists, isDirectory } from '@/utils/fs-utils';
import { printfileListAsFileTree } from '@/utils/path';
import {
  exit_fail_on_error,
  exit_success_on_error_ignore,
} from '@/utils/process';
import { validation_spinner } from '@/validation/validation-spinner';
import { valid_zip_file_path } from '@/validation/zip';
import confirm from '@inquirer/confirm';
import chalk from 'chalk';
import figureSet from 'figures';
import JSZip from 'jszip';
import ora from 'ora';

const name = 'unzip';
const description = 'Unzip the content of a zip file';

const unzipCommand = createCommand(name, description)
  .requiredOption('-i, --input <file>', 'the input zip file to unzip')
  .option(
    '-o, --output <output>',
    'the output directory where to store the zip content',
    '.'
  )
  .option(
    '--dry-run',
    'lists the files that will be unzipped WITHOUT unzipping the archive',
    false
  );

unzipCommand.action(async (options) => {
  await exit_fail_on_error(async () => {
    // Validation step
    await validation_spinner({
      name: 'input path',
      value: options.input,
      fn: async () => valid_zip_file_path(options.input),
    });

    if (options.dryRun) {
      try {
        const zip = new JSZip();

        const content = await readFile(options.input);
        const archive = await zip.loadAsync(content);

        const filenames = Object.keys(archive.files).filter(
          (el) => !el.endsWith('/')
        );

        if (filenames.length > 0) {
          printfileListAsFileTree(filenames);
        } else {
          console.error('Nothing to unzip');
        }
      } catch (e) {
        if (e instanceof Error) console.error(e.message);
        else console.error(e);
      }

      return;
    }

    // Check if the directory exists
    try {
      if (await exists(options.output)) {
        // Check if it is a directory
        if (await isDirectory(options.output)) {
          // Check if empty
          const dir = await readdir(options.output);
          if (dir.length !== 0) {
            const proceed = await exit_success_on_error_ignore(
              async () =>
                await confirm({
                  message: `Directory ${options.output} is not empty. Proceed anyway?`,
                  default: false,
                })
            );
            if (!proceed) {
              return;
            }
          }
        } else {
          throw new Error(
            `The ${options.output} path already exists but it is not a directory`
          );
        }
      } else {
        // Create it
        await mkdir(options.output, { recursive: true });
      }
    } catch (e) {
      if (e instanceof Error)
        console.error(`${chalk.red(figureSet.cross)} ${e.message}`);
      else console.error(e);
      return;
    }

    const spinner = ora(
      `Extracting ${options.input} file to ${options.output}`
    );
    try {
      const zip = new JSZip();
      spinner.start();

      const content = await readFile(options.input);
      const archive = await zip.loadAsync(content);

      const filenames = Object.keys(archive.files).filter(
        (el) => !el.endsWith('/')
      );

      let i = 0;
      for (const filename of filenames) {
        spinner.text = `Extracting ${options.input} file to ${
          options.output
        } (${++i}/${filenames.length} files) ${chalk.dim(`[${filename}]`)}`;

        const uncompressedFileContent = await archive
          .file(filename)
          ?.async('uint8array');
        const filePath = join(options.output, filename);
        const dirs = dirname(filePath);
        await mkdir(dirs, { recursive: true });

        if (uncompressedFileContent) {
          await writeFile(filePath, uncompressedFileContent, {
            encoding: 'utf-8',
          });
        }
      }

      spinner.succeed(
        `Extracted ${options.input} file to ${options.output} (${filenames.length}/${filenames.length} files)`
      );
    } catch (e) {
      spinner.fail();
      if (e instanceof Error) console.error(e.message);
      else console.error(e);
    }
  });
});

export default unzipCommand;
