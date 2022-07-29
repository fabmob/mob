/**
 * Returns the correct image filename depending on the transport type.
 * Returns specific filename if there are more than 2 transport types.
 * @param transportList
 */
export const getDispositifImgFilename = (transportList: string[]): string => {
  if (transportList.length > 1) {
    return 'aide-multiple.svg';
  }
  return `${transportList[0]}.svg`;
};
