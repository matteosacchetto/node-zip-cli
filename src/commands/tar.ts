import { is_windows } from '@/core/constants';
import { list_entries } from '@/core/scan-fs';
import { create_tar } from '@/core/tar';
import { logger } from '@/logger';
import { confirm_conflict_prompt } from '@/prompts/confirm-conflict';
import { confirm_overwrite_prompt } from '@/prompts/confirm-overwrite';
import { createCommand } from '@/utils/command';
import { log_conflicts } from '@/utils/conflicts';
import { exists, unique_entries } from '@/utils/fs';
import { printfile_list_as_file_tree } from '@/utils/path';
import {
  exit_fail_on_error,
  exit_on_finish,
  exit_success_on_false,
} from '@/utils/process';
import { valid_output_tar_file_path } from '@/validation/tar';
import { validation_spinner } from '@/validation/validation-spinner';
import { createOption } from '@commander-js/extra-typings';
import { InvalidArgumentError } from 'commander';

const name = 'tar';
const description =
  'tar files and directories ignoring files specified in .zipignore and .gitignore';

const tarCommand = createCommand(name, description)
  .option('-i, --input <input...>', 'the files or directories to tar', [
    '.',
  ] as string[])
  .option(
    '-g, --gzip [compression-level]',
    'gzip the archive',
    (compressionLevel) => {
      if (compressionLevel === '') {
        return true as boolean;
      }

      const parsedValue = Number.parseInt(compressionLevel, 10);
      if (parsedValue < 0 || parsedValue > 9) {
        throw new InvalidArgumentError(
          'compression level must be a integer number between 0 (no compression) and 9 (maximum compression)'
        );
      }
      return parsedValue;
    },
    false
  )
  .option(
    '-o, --output <output-file>',
    'the filename of the tar file to create'
  )
  .addOption(
    createOption('-k, --keep-parent <mode>', 'keep the parent directories')
      .choices(['none', 'last', 'full'] as const)
      .default('full' as const)
  )
  .option('-y, --yes', 'answers yes to every question', false)
  .option('-e, --exclude <paths...>', 'ignore the following paths')
  .option('--allow-git', 'allow .git to be included in the tar', false)
  .option(
    '--dry-run',
    'lists the files that will be tarred WITHOUT creating the tar file',
    false
  );

tarCommand.action(async (options) => {
  const output =
    options.output ?? options.gzip === false ? 'out.tar' : 'out.tgz';
  await exit_fail_on_error(async () => {
    const unique_inputs = unique_entries(options.input);

    await validation_spinner({
      name: 'output path',
      value: output,
      fn: async () => valid_output_tar_file_path(output, options.gzip),
    });

    if (!options.yes && !options.dryRun) {
      if (await exists(output)) {
        await exit_success_on_false(() => confirm_overwrite_prompt(output));
      }
    }

    const [unique_list, conflicting_list] = await list_entries(
      unique_inputs,
      options.keepParent,
      options.allowGit,
      options.exclude
    );

    if (conflicting_list.length) {
      log_conflicts(conflicting_list);

      if (!options.yes) {
        await exit_success_on_false(() => confirm_conflict_prompt());
      } else {
        logger.info('Creating the archive excluding those files');
      }
    }

    const num_files = unique_list.filter((el) => el.type === 'file').length;
    if (options.dryRun) {
      await exit_on_finish(() => {
        if (num_files > 0) {
          printfile_list_as_file_tree(unique_list, is_windows);
        } else {
          console.error('Nothing to tar');
        }
      });
    }

    await create_tar(output, unique_list, num_files, options.gzip);
  });
});

export default tarCommand;
