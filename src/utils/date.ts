export const date_to_utc = (date: Date) => {
  return new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
};

export const date_from_utc = (date: Date) => {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
};
