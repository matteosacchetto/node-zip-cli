import { stat } from 'fs/promises';

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
