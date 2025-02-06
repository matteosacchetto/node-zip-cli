import { is_windows, preset_compression_level } from '@/core/constants';
import { create_tar } from '@/core/tar';
import { printfile_list_as_file_tree } from '@/core/tree';
import { list_entries } from '@/core/walk';
import { logger } from '@/logger';
import { confirm_conflict_prompt } from '@/prompts/confirm-conflict';
import { confirm_overwrite_prompt } from '@/prompts/confirm-overwrite';
import type {
  DisableIgnoreOption,
  KeepParentOption,
  SymlinkOption,
} from '@/types/fs';
import { createCommand } from '@/utils/command';
import { log_conflicts } from '@/utils/conflicts';
import { exists, unique_entries } from '@/utils/fs';
import { normalize_entries } from '@/utils/path';
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
  .addOption(
    createOption('-g, --gzip [compression-level]', 'gzip the archive')
      .argParser((compressionLevel) => {
        if (compressionLevel === '') {
          return preset_compression_level;
        }

        const parsedValue = +compressionLevel;
        if (
          Number.isNaN(parsedValue) ||
          !Number.isInteger(parsedValue) ||
          parsedValue < 0 ||
          parsedValue > 9
        ) {
          throw new InvalidArgumentError(
            'compression level must be a integer number between 0 (no compression) and 9 (maximum compression)'
          );
        }
        return parsedValue;
      })
      .default<false>(false)
      .preset(preset_compression_level)
  )
  .option(
    '-o, --output <output-file>',
    'the filename of the tar file to create'
  )
  .addOption(
    createOption('-k, --keep-parent <mode>', 'keep the parent directories')
      .choices<KeepParentOption[]>(['none', 'last', 'full'])
      .default<KeepParentOption>('full')
  )
  .addOption(
    createOption('-s, --symlink [mode]', 'handle symlinks (experimental)')
      .choices<SymlinkOption[]>(['none', 'resolve', 'keep'])
      .default<SymlinkOption>('none')
      .preset<SymlinkOption>('resolve')
  )
  .addOption(
    createOption('--disable-ignore [mode]', 'disable some or all ignore rules')
      .choices<DisableIgnoreOption[]>([
        'none',
        'zipignore',
        'gitignore',
        'ignore-files',
        'exclude-rules',
        'all',
      ])
      .default<DisableIgnoreOption>('none')
      .preset<DisableIgnoreOption>('ignore-files')
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
    options.output ?? (options.gzip === false ? 'out.tar' : 'out.tgz');

  await exit_fail_on_error(async () => {
    const unique_inputs = unique_entries(normalize_entries(options.input));

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

    const [
      unique_list,
      conflicting_list,
      absolute_path_to_clean_entry_with_mode,
    ] = await list_entries(
      unique_inputs,
      is_windows,
      options.keepParent,
      options.symlink,
      options.allowGit,
      options.exclude,
      options.disableIgnore
    );

    if (conflicting_list.length) {
      log_conflicts(conflicting_list);

      if (!options.yes) {
        await exit_success_on_false(() => confirm_conflict_prompt());
      } else {
        logger.info('Creating the archive excluding those files');
      }
    }

    const num_files = unique_list.filter(
      (el) => el.type !== 'directory'
    ).length;
    if (options.dryRun) {
      await exit_on_finish(() => {
        if (num_files > 0) {
          printfile_list_as_file_tree(
            unique_list,
            absolute_path_to_clean_entry_with_mode,
            is_windows
          );
        } else {
          logger.write_error('Nothing to tar');
        }
      });
    }

    await create_tar(
      output,
      unique_list,
      absolute_path_to_clean_entry_with_mode,
      num_files,
      options.gzip,
      is_windows
    );
  });
});

export default tarCommand;
