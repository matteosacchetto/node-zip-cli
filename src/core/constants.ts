import { platform } from 'node:os';

export const is_windows = platform() === 'win32';
export const preset_compression_level = 6;
