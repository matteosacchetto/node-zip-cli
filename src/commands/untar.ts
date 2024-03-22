import { mkdir, readdir } from 'node:fs/promises';
import { extract_tar, read_tar } from '@/core/tar';
import { confirm_not_empty_dir_prompt } from '@/prompts/confirm-not-empty-dir';
import { createCommand } from '@/utils/command';
import { exists, isDirectory } from '@/utils/fs';
import { printfileListAsFileTree } from '@/utils/path';
import {
  exit_fail_on_error,
  exit_on_finish,
  exit_success_on_false,
} from '@/utils/process';
import { validation_spinner } from '@/validation/validation-spinner';
import { valid_tar_file_path } from '@/validation/tar';

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
  );

untarCommand.action(async (options) => {
  await exit_fail_on_error(async () => {
    await validation_spinner({
      name: 'input path',
      value: options.input,
      fn: async () =>
        valid_tar_file_path(
          options.input,
          options.input.endsWith('.tgz') || options.input.endsWith('.tar.gz')
        ),
    });

    if (options.dryRun) {
      await exit_on_finish(async () => {
        const filenames = await read_tar(options.input);
        if (filenames.length > 0) {
          printfileListAsFileTree(filenames);
        } else {
          console.error('Nothing to untar');
        }
      });
    }

    if (await exists(options.output)) {
      if (!(await isDirectory(options.output))) {
        throw new Error(
          `The ${options.output} path already exists but it is not a directory`
        );
      }

      // Check if empty
      const dir = await readdir(options.output);
      if (dir.length !== 0) {
        await exit_success_on_false(() =>
          confirm_not_empty_dir_prompt(options.output)
        );
      }
    }

    await mkdir(options.output, { recursive: true });

    await extract_tar(options.input, options.output);
  });
});

export default untarCommand;
