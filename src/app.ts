import { createCommand } from './lib/command';
import { name } from './config';
import zipCommand from './commands/zip';
import unzipCommand from './commands/unzip';

const program = createCommand(name, '');

// Add sub-programs
program.addCommand(zipCommand);
program.addCommand(unzipCommand);

// Parse arguments
program.parse(process.argv);
