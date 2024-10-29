export const is_symlink = (mode: number) => {
  return (mode & 0o770000) >> 12 === 10;
};
