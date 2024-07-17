import type { Ignore } from 'ignore';

export type IgnoreFilter = {
  path: string;
  filter: Ignore;
};
