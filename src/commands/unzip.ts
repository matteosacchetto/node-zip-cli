import { createCommand } from '@/lib/command';
import { dirname, join } from 'path';
import { mkdir, readdir, readFile, writeFile } from 'fs/promises';
import JSZip from 'jszip';
import ora from 'ora';
import isValidFilename from 'valid-filename';
import { exists, isDirectory } from '@/utils/fs-utils';
import chalk from 'chalk';
import figureSet from 'figures';
import { printfileListAsFileTree } from '@/utils/path-utils';
import confirm from '@inquirer/confirm';

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
  const { input, output } = options;

  // Validation step
  if (!isValidFilename(input) || !input.endsWith('.zip')) {
    console.error('The input file name is not valid');
    return;
  }

  if (options.dryRun) {
    try {
      const zip = new JSZip();

      const content = await readFile(input);
      const archive = await zip.loadAsync(content);

      const filenames = Object.keys(archive.files).filter(
        (el) => !el.endsWith('/')
      );

      if (filenames.length > 0) {
        printfileListAsFileTree(filenames);
      } else {
        console.error(`Nothing to unzip`);
      }
    } catch (e) {
      if (e instanceof Error) console.error(e.message);
      else console.error(e);
    }

    return;
  }

  // Check if the directory exists
  try {
    if (await exists(output)) {
      // Check if it is a directory
      if (await isDirectory(output)) {
        // Check if empty
        const dir = await readdir(output);
        if (dir.length !== 0) {
          const proceed = await confirm({
            message: `Directory ${output} is not empty. Proceed anyway?`,
            default: false,
          });
          if (!proceed) {
            return;
          }
        }
      } else {
        throw new Error(
          `The ${output} path already exists but it is not a directory`
        );
      }
    } else {
      // Create it
      await mkdir(output, { recursive: true });
    }
  } catch (e) {
    if (e instanceof Error)
      console.error(`${chalk.red(figureSet.cross)} ${e.message}`);
    else console.error(e);
    return;
  }

  const spinner = ora(`Extracting ${input} file to ${output}`);
  try {
    const zip = new JSZip();
    spinner.start();

    const content = await readFile(input);
    const archive = await zip.loadAsync(content);

    const filenames = Object.keys(archive.files).filter(
      (el) => !el.endsWith('/')
    );

    let i = 0;
    for (const filename of filenames) {
      spinner.text = `Extracting ${input} file to ${output} (${++i}/${
        filenames.length
      } files) ${chalk.dim(`[${filename}]`)}`;

      const uncompressedFileContent = await archive
        .file(filename)
        ?.async('uint8array');
      const filePath = join(output, filename);
      const dirs = dirname(filePath);
      await mkdir(dirs, { recursive: true });

      if (uncompressedFileContent) {
        await writeFile(filePath, uncompressedFileContent, {
          encoding: 'utf-8',
        });
      }
    }

    spinner.succeed(
      `Extracted ${input} file to ${output} (${filenames.length}/${filenames.length} files)`
    );
  } catch (e) {
    spinner.fail();
    if (e instanceof Error) console.error(e.message);
    else console.error(e);
  }
});

export default unzipCommand;
