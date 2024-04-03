import { mkdir, readdir } from 'node:fs/promises';
import { is_windows } from '@/core/constants';
import { extract_zip, read_zip } from '@/core/zip';
import { confirm_not_empty_dir_prompt } from '@/prompts/confirm-not-empty-dir';
import { createCommand } from '@/utils/command';
import { exists, is_directory } from '@/utils/fs';
import { printfile_list_as_file_tree } from '@/utils/path';
import {
  exit_fail_on_error,
  exit_on_finish,
  exit_success_on_false,
} from '@/utils/process';
import { validation_spinner } from '@/validation/validation-spinner';
import { valid_zip_file_path } from '@/validation/zip';

const name = 'unzip';
const description = 'unzip the content of a zip file';

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
  )
  .option('-y, --yes', 'answers yes to every question', false);

unzipCommand.action(async (options) => {
  await exit_fail_on_error(async () => {
    // Validation step
    await validation_spinner({
      name: 'input path',
      value: options.input,
      fn: async () => valid_zip_file_path(options.input),
    });

    if (options.dryRun) {
      await exit_on_finish(async () => {
        const [filenames, map_absolute_path_to_clean_entry_with_mode] =
          await read_zip(options.input);

        if (filenames.length > 0) {
          printfile_list_as_file_tree(
            filenames,
            map_absolute_path_to_clean_entry_with_mode,
            is_windows
          );
        } else {
          console.error('Nothing to unzip');
        }
      });
    }

    if (await exists(options.output)) {
      if (!(await is_directory(options.output))) {
        throw new Error(
          `The ${options.output} path already exists but it is not a directory`
        );
      }

      // Check if empty
      const dir = await readdir(options.output);
      if (dir.length !== 0 && !options.yes) {
        await exit_success_on_false(() =>
          confirm_not_empty_dir_prompt(options.output)
        );
      }
    }

    await mkdir(options.output, { recursive: true });

    await extract_zip(options.input, options.output);
  });
});

export default unzipCommand;
