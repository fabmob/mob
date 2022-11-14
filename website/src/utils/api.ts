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
