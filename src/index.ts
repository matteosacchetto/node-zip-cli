#!/usr/bin/env node

import findCommand from './commands/find';
import tarCommand from './commands/tar';
import untarCommand from './commands/untar';
import unzipCommand from './commands/unzip';
import zipCommand from './commands/zip';
import { description, name } from './config';
import { createCommand } from './utils/command';
import { uncapitalize } from './utils/string';

const program = createCommand(name, uncapitalize(description));
program.addCommand(zipCommand);
program.addCommand(unzipCommand);
program.addCommand(tarCommand);
program.addCommand(untarCommand);
program.addCommand(findCommand);
program.helpCommand(true);

program.parse(process.argv);
