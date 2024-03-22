#!/usr/bin/env node

import unzipCommand from './commands/unzip';
import zipCommand from './commands/zip';
import { description, name } from './config';
import { createCommand } from './utils/command';
import { uncapitalize } from './utils/string';

const program = createCommand(name, uncapitalize(description));
program.addCommand(zipCommand);
program.addCommand(unzipCommand);

program.parse(process.argv);
