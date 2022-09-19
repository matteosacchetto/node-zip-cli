import { createCommand } from '@/lib/command';

import { createWriteStream } from 'fs';
import { readFile } from 'fs/promises';
import JSZip from 'jszip';
import { scanFs } from '@/lib/scan-fs';
import isValidFilename from 'valid-filename';
import inquirer from 'inquirer';
import { exists, isDirectory } from '@/utils/fs-utils';
import ora from 'ora';
import chalk from 'chalk';
import figureSet from 'figures';
import { relative } from 'path';
import { isChildOfCurrentDir } from '@/utils/path-utils';

type ZipCommanOptions = {
  input: string[];
  output: string;
  yes: boolean;
};

type ZipCommandQuestions = {
  overwrite: boolean;
};

const name = 'zip';
const description =
  'zip files and directories ignoring files specified in .zipignore and .gitignore';

const zipCommand = createCommand(name, description);
zipCommand
  .option('-i, --input <input...>', 'the files or directories to zip', ['.'])
  .option(
    '-o, --output <output-file>',
    'the filename of the zip file to create',
    'out.zip'
  )
  .option('-y, --yes', 'answers yes to every question', false);

zipCommand.action(async (options: ZipCommanOptions) => {
  const { output, input } = options;
  const uniqueEntries = [...new Set(input)];

  // Validation step
  if (
    !isValidFilename(output) ||
    !output.endsWith('.zip') ||
    !isChildOfCurrentDir(output)
  ) {
    console.error('The output file name is not valid');
    return;
  }

  if (!options.yes) {
    if (await exists(output)) {
      const answer: ZipCommandQuestions = await inquirer.prompt([
        {
          type: 'confirm',
          default: false,
          name: 'overwrite',
          message: `The file ${output} already exists, overwrite it?`,
        },
      ]);

      if (!answer.overwrite) {
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
        files.push(
          ...(await scanFs(entry)).map((el) => relative(process.cwd(), el))
        );
      } else {
        files.push(relative(process.cwd(), entry));
      }
    }

    const spinner = ora(`Creating ${output} file (0/${files.length} files)`);

    if (files.length > 0) {
      try {
        let i = 0;
        spinner.start();
        for (const file of files) {
          i++;
          spinner.text = `Creating ${output} file (${i}/${files.length} files)`;
          const content = await readFile(file);
          zip.file(file, content);
        }

        zip
          .generateNodeStream({ type: 'nodebuffer', streamFiles: true })
          .pipe(createWriteStream(output))
          .on('error', (e) => {
            spinner.fail();
            console.error(e);
          })
          .on('finish', () => {
            spinner.succeed(
              `Created ${output} file (${i}/${files.length} files)`
            );
          });
      } catch (e) {
        spinner.fail();
        if (e instanceof Error) console.error(e.message);
        else console.error(e);
      }
    } else {
      console.error(
        `${chalk.yellow.bold(
          figureSet.arrowDown
        )} Creating ${output} file ${chalk.dim('[SKIPPED]')}`
      );
      console.error(`Nothing to zip`);
    }
  } catch (e) {
    if (e instanceof Error) console.error(e.message);
    else console.error(e);
  }
});

export default zipCommand;
