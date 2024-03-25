import { platform } from 'node:os';

export const is_windows = platform() === 'win32';
