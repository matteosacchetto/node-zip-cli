import confirm from '@inquirer/confirm';
import { exit_success_on_error_ignore } from '@/utils/process';

export const confirm_not_empty_dir_prompt = async (
  path: string,
  default_value = false
) => {
  const confirm_not_empty_dir = await exit_success_on_error_ignore(
    async () =>
      await confirm({
        message: `Directory ${path} is not empty. Proceed anyway?`,
        default: default_value,
      })
  );

  return confirm_not_empty_dir;
};
