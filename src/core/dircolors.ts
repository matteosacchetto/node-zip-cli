import { extname } from 'node:path';
import chalk, { type ChalkInstance } from 'chalk';

// These are obtained from `dircolors --print-database`
const formats = {
  RESET: chalk.reset,
  DIR: chalk.bold.blue,
  LINK: chalk.bold.cyan,
  FIFO: chalk.bgBlack.yellow,
  SOCK: chalk.bold.magenta,
  BLK: chalk.bold.bgBlack.yellow,
  CHR: chalk.bold.bgBlack.yellow,
  ORPHAN: chalk.bold.bgBlack.red,
  SETUID: chalk.bgRed.white,
  SETGID: chalk.bgYellow.black,
  STICKY_OTHER_WRITABLE: chalk.bgGreen.black,
  OTHER_WRITABLE: chalk.bgGreen.blue,
  STICKY: chalk.bgBlue.white,
  EXEC: chalk.bold.green,
};

const windows_extensions: ReadonlyMap<string, ChalkInstance> = new Map([
  // Windows executable
  ['.cmd', chalk.bold.green],
  ['.exe', chalk.bold.green],
  ['.com', chalk.bold.green],
  ['.btm', chalk.bold.green],
  ['.bat', chalk.bold.green],
  ['.ps1', chalk.bold.green],
]);

const extensions: ReadonlyMap<string, ChalkInstance> = new Map([
  // Archive
  ['.tar', chalk.bold.red],
  ['.tgz', chalk.bold.red],
  ['.arc', chalk.bold.red],
  ['.arj', chalk.bold.red],
  ['.taz', chalk.bold.red],
  ['.lha', chalk.bold.red],
  ['.lz4', chalk.bold.red],
  ['.lzh', chalk.bold.red],
  ['.lzma', chalk.bold.red],
  ['.tlz', chalk.bold.red],
  ['.txz', chalk.bold.red],
  ['.tzo', chalk.bold.red],
  ['.t7z', chalk.bold.red],
  ['.zip', chalk.bold.red],
  ['.z', chalk.bold.red],
  ['.dz', chalk.bold.red],
  ['.gz', chalk.bold.red],
  ['.lrz', chalk.bold.red],
  ['.lz', chalk.bold.red],
  ['.lzo', chalk.bold.red],
  ['.xz', chalk.bold.red],
  ['.zst', chalk.bold.red],
  ['.tzst', chalk.bold.red],
  ['.bz2', chalk.bold.red],
  ['.bz', chalk.bold.red],
  ['.tbz', chalk.bold.red],
  ['.tbz2', chalk.bold.red],
  ['.tz', chalk.bold.red],
  ['.deb', chalk.bold.red],
  ['.rpm', chalk.bold.red],
  ['.jar', chalk.bold.red],
  ['.war', chalk.bold.red],
  ['.ear', chalk.bold.red],
  ['.sar', chalk.bold.red],
  ['.rar', chalk.bold.red],
  ['.alz', chalk.bold.red],
  ['.ace', chalk.bold.red],
  ['.zoo', chalk.bold.red],
  ['.cpio', chalk.bold.red],
  ['.7z', chalk.bold.red],
  ['.rz', chalk.bold.red],
  ['.cab', chalk.bold.red],
  ['.wim', chalk.bold.red],
  ['.swm', chalk.bold.red],
  ['.dwm', chalk.bold.red],
  ['.esd', chalk.bold.red],

  // Images/Video
  ['.jpg', chalk.bold.magenta],
  ['.jpeg', chalk.bold.magenta],
  ['.mjpg', chalk.bold.magenta],
  ['.mjpeg', chalk.bold.magenta],
  ['.gif', chalk.bold.magenta],
  ['.bmp', chalk.bold.magenta],
  ['.pbm', chalk.bold.magenta],
  ['.pgm', chalk.bold.magenta],
  ['.ppm', chalk.bold.magenta],
  ['.tga', chalk.bold.magenta],
  ['.xbm', chalk.bold.magenta],
  ['.xpm', chalk.bold.magenta],
  ['.tif', chalk.bold.magenta],
  ['.tiff', chalk.bold.magenta],
  ['.png', chalk.bold.magenta],
  ['.svg', chalk.bold.magenta],
  ['.svgz', chalk.bold.magenta],
  ['.mng', chalk.bold.magenta],
  ['.pcx', chalk.bold.magenta],
  ['.mov', chalk.bold.magenta],
  ['.mpg', chalk.bold.magenta],
  ['.mpeg', chalk.bold.magenta],
  ['.m2v', chalk.bold.magenta],
  ['.mkv', chalk.bold.magenta],
  ['.webm', chalk.bold.magenta],
  ['.webp', chalk.bold.magenta],
  ['.ogm', chalk.bold.magenta],
  ['.mp4', chalk.bold.magenta],
  ['.m4v', chalk.bold.magenta],
  ['.mp4v', chalk.bold.magenta],
  ['.vob', chalk.bold.magenta],
  ['.qt', chalk.bold.magenta],
  ['.nuv', chalk.bold.magenta],
  ['.wmv', chalk.bold.magenta],
  ['.asf', chalk.bold.magenta],
  ['.rm', chalk.bold.magenta],
  ['.rmvb', chalk.bold.magenta],
  ['.flc', chalk.bold.magenta],
  ['.avi', chalk.bold.magenta],
  ['.fli', chalk.bold.magenta],
  ['.flv', chalk.bold.magenta],
  ['.gl', chalk.bold.magenta],
  ['.dl', chalk.bold.magenta],
  ['.xcf', chalk.bold.magenta],
  ['.xwd', chalk.bold.magenta],
  ['.yuv', chalk.bold.magenta],
  ['.cgm', chalk.bold.magenta],
  ['.emf', chalk.bold.magenta],
  // https://wiki.xiph.org/MIME_Types_and_File_Extensions
  ['.ogv', chalk.bold.magenta],
  ['.ogx', chalk.bold.magenta],

  // Audio formats
  ['.aac', chalk.cyan],
  ['.au', chalk.cyan],
  ['.flac', chalk.cyan],
  ['.m4a', chalk.cyan],
  ['.mid', chalk.cyan],
  ['.midi', chalk.cyan],
  ['.mka', chalk.cyan],
  ['.mp3', chalk.cyan],
  ['.mpc', chalk.cyan],
  ['.ogg', chalk.cyan],
  ['.ra', chalk.cyan],
  ['.wav', chalk.cyan],
  // https://wiki.xiph.org/MIME_Types_and_File_Extensions
  ['.oga', chalk.cyan],
  ['.opus', chalk.cyan],
  ['.spx', chalk.cyan],
  ['.xspf', chalk.cyan],
]);

/**
 * This function tries to replicate (in a reduce form) the default behavior of the
 * `dircolors` linux command
 */
export const colorize = (
  path: string,
  mode: number,
  is_windows: boolean,
  broken_or_missing = false
) => {
  const type = (mode & 0o770000) >> 12;
  const setuid = !!((mode & 4000) >> 11);
  const setgid = !!((mode & 2000) >> 10);
  const sticky = !!((mode & 1000) >> 9);
  const exec = !!(mode & 0o000111);

  switch (type) {
    case 1: {
      // FIFO
      return formats.FIFO(path);
    }

    case 2: {
      // CHR
      return formats.CHR(path);
    }

    case 4: {
      // DIR
      const other_writable = !!(mode & 0o2);
      if (sticky) {
        if (other_writable) {
          return formats.STICKY_OTHER_WRITABLE(path);
        }
        return formats.STICKY(path);
      }

      if (other_writable) {
        // Other writable
        return formats.OTHER_WRITABLE(path);
      }

      return formats.DIR(path);
    }

    case 6: {
      // BLK
      return formats.BLK(path);
    }

    case 8: {
      // FIlE
      if (broken_or_missing) {
        return formats.ORPHAN(path);
      }

      if (exec) {
        return formats.EXEC(path);
      }

      if (setgid) {
        return formats.SETGID(path);
      }

      if (setuid) {
        return formats.SETUID(path);
      }

      const ext = extname(path);
      if (extensions.has(ext)) {
        return extensions.get(ext)!(path);
      }

      if (is_windows && windows_extensions.has(ext)) {
        return windows_extensions.get(ext)!(path);
      }

      return formats.RESET(path);
    }

    case 10: {
      // LINK
      if (broken_or_missing) {
        return formats.ORPHAN(path);
      }

      return formats.LINK(path);
    }

    case 12: {
      // SOCK
      return formats.SOCK(path);
    }
  }
};
