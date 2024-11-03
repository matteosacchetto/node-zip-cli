import { is_windows, preset_compression_level } from '@/core/constants';
import { printfile_list_as_file_tree } from '@/core/tree';
import { list_entries } from '@/core/walk';
import { create_zip } from '@/core/zip';
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
import { validation_spinner } from '@/validation/validation-spinner';
import { valid_zip_file_path } from '@/validation/zip';
import { createOption } from '@commander-js/extra-typings';
import { InvalidArgumentError } from 'commander';

const name = 'zip';
const description =
  'zip files and directories ignoring files specified in .zipignore and .gitignore';

const zipCommand = createCommand(name, description)
  .option('-i, --input <input...>', 'the files or directories to zip', [
    '.',
  ] as string[])
  .addOption(
    createOption('-d, --deflate [compression-level]', 'deflate the files')
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
    'the filename of the zip file to create',
    'out.zip'
  )
  .addOption(
    createOption('-k, --keep-parent <mode>', 'keep the parent directories')
      .choices<KeepParentOption[]>(['none', 'last', 'full'])
      .default<KeepParentOption>('full')
  )
  .addOption(
    createOption('-s, --symlink <mode>', 'handle symlinks (experimental)')
      .choices<SymlinkOption[]>(['none', 'resolve', 'keep'])
      .default<SymlinkOption>('none')
  )
  .addOption(
    createOption('--disable-ignore <mode>', 'disable some or all ignore rules')
      .choices<DisableIgnoreOption[]>([
        'none',
        'zipignore',
        'gitignore',
        'ignore-files',
        'exclude-rules',
        'all',
      ])
      .default<DisableIgnoreOption>('none')
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
    const unique_inputs = unique_entries(normalize_entries(options.input));

    await validation_spinner({
      name: 'output path',
      value: options.output,
      fn: async () => valid_zip_file_path(options.output),
    });

    if (!options.yes && !options.dryRun) {
      if (await exists(options.output)) {
        await exit_success_on_false(() =>
          confirm_overwrite_prompt(options.output)
        );
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
          console.error('Nothing to zip');
        }
      });
    }

    await create_zip(
      options.output,
      unique_list,
      absolute_path_to_clean_entry_with_mode,
      num_files,
      options.deflate,
      is_windows
    );
  });
});

export default zipCommand;
