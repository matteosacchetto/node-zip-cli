import { logger } from '@/logger';

export const log_indent = ({
  indentation_increment = 2,
  fn,
}: {
  indentation_increment?: number;
  fn: () => void;
}) => {
  const indentation = logger.indentation;
  logger.indent(indentation + indentation_increment);
  fn();
  logger.indent(indentation);
};
