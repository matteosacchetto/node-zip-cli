import { exit_success_on_error_ignore } from '@/utils/process';
import confirm from '@inquirer/confirm';
import chalk from 'chalk';

export const confirm_conflict_prompt = async (default_value = false) => {
  const confirm_overwrite = await exit_success_on_error_ignore(
    async () =>
      await confirm({
        message: `Proceed anyway? ${chalk.reset.yellow(
          '(conflicting files will not be added)'
        )}`,
        default: default_value,
      })
  );

  return confirm_overwrite;
};
