export const capitalize = (str: string): string => {
  // Capitalize string
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const uncapitalize = (str: string): string => {
  // Uncapitalize string
  return str.charAt(0).toLowerCase() + str.slice(1);
};
