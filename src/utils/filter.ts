export type ValidValue<T> = Exclude<T, null | undefined | 0 | '' | false>;
export const BooleanFilter = <T>(x: T): x is ValidValue<T> => Boolean(x);
