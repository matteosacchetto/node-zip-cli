import unzipCommand from './commands/unzip';
import zipCommand from './commands/zip';
import { name } from './config';
import { createCommand } from './lib/command';

const program = createCommand(name, '');

// Add sub-programs
program.addCommand(zipCommand);
program.addCommand(unzipCommand);

// Parse arguments
program.parse(process.argv);
