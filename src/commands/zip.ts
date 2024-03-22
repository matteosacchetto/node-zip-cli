import { list_entries } from '@/core/scan-fs';
import { create_zip } from '@/core/zip';
import { logger } from '@/logger';
import { confirm_conflict_prompt } from '@/prompts/confirm-conflict';
import { confirm_overwrite_prompt } from '@/prompts/confirm-overwrite';
import { createCommand } from '@/utils/command';
import { log_conflicts } from '@/utils/conflicts';
import { exists, unique_entries } from '@/utils/fs';
import { printfileListAsFileTree } from '@/utils/path';
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
  .option(
    '-e, --exclude <paths...>',
    'ignore the following paths (experimental)'
  )
  .option('--allow-git', 'allow .git to be included in the zip', false)
  .option(
    '--dry-run',
    'lists the files that will be zipped WITHOUT creating the zip file',
    false
  );

zipCommand.action(async (options) => {
  await exit_fail_on_error(async () => {
    const unique_inputs = unique_entries(options.input);

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
          printfileListAsFileTree(unique_list);
        } else {
          console.error('Nothing to zip');
        }
      });
    }

    await create_zip(options.output, unique_list, num_files, options.deflate);
  });
});

export default zipCommand;
