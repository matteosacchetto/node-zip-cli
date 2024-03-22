export const get_full_mode = (
  partial_mode: number | string,
  type: 'file' | 'directory'
) => {
  if (type === 'file') return +partial_mode + 0o100000;
  if (type === 'directory') return +partial_mode + 0o40000;

  return +partial_mode;
};
