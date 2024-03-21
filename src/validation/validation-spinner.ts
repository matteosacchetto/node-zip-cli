import { scoped_spinner_wrapper } from '@/utils/spinner-wrapper';

export const validation_spinner = ({
  name,
  value,
  fn,
}: {
  name: string;
  value: string;
  fn: () => Promise<boolean>;
}) => {
  return scoped_spinner_wrapper({
    scope: `Validating ${name}`,
    message: `${value}`,
    fn,
  });
};
