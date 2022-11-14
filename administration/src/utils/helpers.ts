/* eslint-disable */
export const isEmailFormatValid = (email) => {
  const regex = new RegExp(
    /^@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
  return email.match(regex);
};

/**
 * Returns the string with white spaces removed
 */
export const removeWhiteSpace = (word: string): string => {
  /**
   * Regex for removing white spaces.
   * Exemple : "  Removing   white spaces  " returns "Removing white spaces".
   */
  const removeSpacesRegex: RegExp = new RegExp('^\\s+|\\s+$|\\s+(?=\\s)', 'g');
  const newWord: string = word.replace(removeSpacesRegex, '');
  return newWord;
};
