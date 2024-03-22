#!/usr/bin/env node

import unzipCommand from './commands/unzip';
import zipCommand from './commands/zip';
import { description, name } from './config';
import { createCommand } from './lib/command';
import { uncapitalize } from './utils/string';

const program = createCommand(name, uncapitalize(description));

// Add sub-programs
program.addCommand(zipCommand);
program.addCommand(unzipCommand);

// Parse arguments
program.parse(process.argv);
