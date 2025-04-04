import { mkdir, readdir } from 'node:fs/promises';
import { is_windows } from '@/core/constants';
import { extract_tar, read_tar } from '@/core/tar';
import { printfile_list_as_file_tree } from '@/core/tree';
import { logger } from '@/logger';
import { confirm_not_empty_dir_prompt } from '@/prompts/confirm-not-empty-dir';
import { createCommand } from '@/utils/command';
import { exists, is_directory } from '@/utils/fs';
import {
  exit_fail_on_error,
  exit_on_finish,
  exit_success_on_false,
} from '@/utils/process';
import { is_gzip_archive } from '@/utils/tar';
import { valid_input_tar_file_path } from '@/validation/tar';
import { validation_spinner } from '@/validation/validation-spinner';

const name = 'untar';
const description = 'untar the content of a tar file';

const untarCommand = createCommand(name, description)
  .requiredOption('-i, --input <file>', 'the input tar file to untar')
  .option(
    '-o, --output <output>',
    'the output directory where to store the tar content',
    '.'
  )
  .option(
    '--dry-run',
    'lists the files that will be untarped WITHOUT untarping the archive',
    false
  )
  .option('-y, --yes', 'answers yes to every question', false);

untarCommand.action(async (options) => {
  await exit_fail_on_error(async () => {
    await validation_spinner({
      name: 'input path',
      value: options.input,
      fn: async () => valid_input_tar_file_path(options.input),
    });
    const is_gzip = await is_gzip_archive(options.input);

    if (options.dryRun) {
      await exit_on_finish(async () => {
        const [filenames, absolute_path_to_clean_entry_with_mode] =
          await read_tar(options.input, is_gzip);
        if (filenames.length > 0) {
          printfile_list_as_file_tree(
            filenames,
            absolute_path_to_clean_entry_with_mode,
            is_windows
          );
        } else {
          logger.write_error('Nothing to untar');
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

    await extract_tar(options.input, options.output, is_gzip, is_windows);
  });
});

export default untarCommand;
