import { is_windows } from '@/core/constants';
import { printfile_list_as_find } from '@/core/find';
import { list_entries } from '@/core/walk';
import type { DisableIgnoreOption, SymlinkOption } from '@/types/fs';
import { createCommand } from '@/utils/command';
import { unique_entries } from '@/utils/fs';
import { normalize_entries } from '@/utils/path';
import { exit_fail_on_error, exit_on_finish } from '@/utils/process';
import { createOption } from '@commander-js/extra-typings';

const name = 'find';
const description =
  'find files and directories ignoring files specified in .zipignore and .gitignore';

const findCommand = createCommand(name, description)
  .option('-i, --input <input...>', 'the files or directories to zip', [
    '.',
  ] as string[])
  .addOption(
    createOption(
      '-t, --type <type...>',
      'filter printed entries (f: file, d: directory, l: symlink)'
    )
      .choices(['f', 'd', 'l'] as const)
      .default(['f', 'd', 'l'] as const)
  )
  .addOption(
    createOption('-s, --symlink [mode]', 'handle symlinks')
      .choices<Exclude<SymlinkOption, 'resolve'>[]>(['none', 'keep'])
      .default<Exclude<SymlinkOption, 'resolve'>>('none')
      .preset<Exclude<SymlinkOption, 'resolve'>>('keep')
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
  .option('-e, --exclude <paths...>', 'ignore the following paths')
  .option('--allow-git', 'allow .git to be included in the zip', false)
  .option('--no-colors', 'do not colorize the output');

findCommand.action(async (options) => {
  await exit_fail_on_error(async () => {
    const unique_inputs = unique_entries(normalize_entries(options.input));
    const type = options.type.map((el) => {
      switch (el) {
        case 'f':
          return 'file';
        case 'd':
          return 'directory';
        case 'l':
          return 'symlink';
      }
    });

    const [unique_list] = await list_entries(
      unique_inputs,
      is_windows,
      'full',
      options.symlink,
      options.allowGit,
      options.exclude,
      options.disableIgnore
    );

    const filtered_list = unique_list.filter((el) => type.includes(el.type));
    const num_files = filtered_list.length;
    await exit_on_finish(() => {
      if (num_files > 0) {
        printfile_list_as_find(filtered_list, is_windows, options.colors);
      }
    });
  });
});

export default findCommand;
