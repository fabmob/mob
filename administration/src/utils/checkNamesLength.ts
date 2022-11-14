/* eslint-disable */
export const checkNamesLength = (name) => {
  return name && name.length >= 2
    ? undefined
    : 'Ce champ doit faire au moins 2 caractères';
};
