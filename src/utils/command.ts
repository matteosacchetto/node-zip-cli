import { Command } from '@commander-js/extra-typings';
import { version } from '@/config';
import { uncapitalize } from '@/utils/string';

export const createCommand = (name: string, description: string): Command => {
  // Initialize CLI (name , description)
  const program = new Command(name);
  program.description(description);

  // Set version
  program.version(version, '-v, --version');

  // Uncapitalize help for sub commands
  program.configureHelp({
    subcommandDescription: (cmd) => {
      return uncapitalize(cmd.description());
    },
  });

  // Show suggestions after a error
  program.showSuggestionAfterError();

  // Return the new Command
  return program;
};
