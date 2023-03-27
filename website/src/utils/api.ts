export interface ApiError {
  code?: number;
  id?: string;
  message: string;
}

export interface ApiErrors {
  errors: { [key: string]: ApiError };
}

export interface ResponseError {
  data: ApiErrors;
  error: string;
  message: string;
  statusCode: number;
}

export const ErrorTypes = {
  20000: 'unknown',
  20001: 'required',
  20002: 'unique',
  20003: 'minLength',
  20004: 'maxLength',
  20005: 'dateFormat',
  20006: 'ageMin',
  20007: 'emailFormat',
  20008: 'enumFalse',
  20009: 'type',
  20010: 'minItems',
  20011: 'maxItems',
};

export interface IFilter<T> {
  where?: any;
  fields?: any;
  order?: string[];
  limit?: number;
  skip?: number;
  offset?: number;
  include?: any;
}

export interface Count {
  count: number;
}

export const stringifyParams = (queryParams: {
  [key: string]: string[] | string | undefined | number | IFilter<Object>;
}): string => {
  const keys = Object.keys(queryParams);
  if (!keys.length) {
    return '';
  }

  const stringifiedParams: string = keys
    .map((key) => {
      const value = queryParams[key];
      return value !== undefined && value !== ''
        ? `${key}=${value}`
        : undefined;
    })
    .filter((key) => !!key)
    .join('&');

  return stringifiedParams !== '' ? `?${stringifiedParams}` : '';
};
