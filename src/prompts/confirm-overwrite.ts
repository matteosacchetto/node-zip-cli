import confirm from '@inquirer/confirm';
import { exit_success_on_error_ignore } from '@/utils/process';

export const confirm_overwrite_prompt = async (
  path: string,
  default_value = false
) => {
  const confirm_overwrite = await exit_success_on_error_ignore(
    async () =>
      await confirm({
        message: `The file ${path} already exists, overwrite it?`,
        default: default_value,
      })
  );

  return confirm_overwrite;
};
