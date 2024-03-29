import { constants, access, stat } from 'node:fs/promises';

export const exists = async (p: string) => {
  try {
    return !!(await stat(p));
  } catch (e) {
    return false;
  }
};

export const isDirectory = async (p: string) => {
  try {
    return (await stat(p)).isDirectory();
  } catch (e) {
    return false;
  }
};

export const isFile = async (p: string) => {
  try {
    return (await stat(p)).isFile();
  } catch (e) {
    return false;
  }
};

export const readAccess = async (path: string) => {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
};
