import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { handleError } from './handleError';
import toast from 'react-hot-toast';
import Strings from './locale/fr.json'

// I wrote this code to prevent console logging errors coming from apis
const API = `${process.env.PATH_API || 'http://localhost:3000'}`;
const API_KEY = `${process.env.API_KEY || 'apikey'}`;
// We give all type of status code in this enum declaration
export enum StatusCode {
  NotFound = 404,
  Conflict = 409,
  PreconditionFailed = 412,
  UnprocessableEntity = 422,
  Forbidden = 403,
}

const headers: Readonly<Record<string, string | boolean>> = {
  Accept: 'application/json',
  'Content-Type': 'application/json; charser=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'X-Requested-With': 'XMLHttpRequest',
  'X-API-Key': API_KEY,
};

// we can use the following function to inject the JWT token through an interceptor
// We get the `accessTolen` from the ls that we set when we authenticated
const injectToken = (config: AxiosRequestConfig): AxiosRequestConfig => {
  try {
    const token = localStorage.getItem('token');

    if (token != null) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  } catch (error: any) {
    throw new Error(error);
  }
};

class Http {
  private instance: AxiosInstance | null = null;
  private toastCounter = 0;
  private toastId = '';

  private get http(): AxiosInstance {
    return this.instance != null ? this.instance : this.initHttp();
  }

  initHttp() {
    const http = axios.create({
      baseURL: API,
      headers,
      withCredentials: false,
    });

    http.interceptors.request.use(
      (config) => {
        this.showToaster();
        return injectToken(config);
      },
      (error) => Promise.reject(error)
    );

    http.interceptors.response.use(
      (response) => {
        this.dismissToaster();
        return response;
      },
      (error) => {
        this.dismissToaster();
        const { response } = error;
        return this.handleError(response);
      }
    );

    this.instance = http;
    return http;
  }

  showToaster = () => {
    if (this.toastCounter === 0)
      this.toastId = toast.loading(Strings['http.loading.message']);
    this.toastCounter++;
  };

  dismissToaster = () => {
    this.toastCounter--;
    if (this.toastCounter === 0) toast.dismiss(this.toastId);
  };

  request<T = any, R = AxiosResponse<T>>(
    config: AxiosRequestConfig
  ): Promise<R> {
    return this.http.request(config);
  }

  // GET method
  get<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<R> {
    return this.http.get<T, R>(url, config);
  }

  // POST method
  post<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: T,
    config?: AxiosRequestConfig
  ): Promise<R> {
    return this.http.post<T, R>(url, data, config);
  }

  // PUT method
  put<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: T,
    config?: AxiosRequestConfig
  ): Promise<R> {
    return this.http.put<T, R>(url, data, config);
  }

  // PATCH method
  patch<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: T,
    config?: AxiosRequestConfig
  ): Promise<R> {
    return this.http.patch<T, R>(url, data, config);
  }

  // Head Method
  head<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<R> {
    return this.http.head<T, R>(url, config);
  }

  // Last but not least DELETE method
  delete<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<R> {
    return this.http.delete<T, R>(url, config);
  }

  // We handle global app errors
  // wse can also handle generic app errors depending on the code status
  private handleError(error: any) {
    try {
      const { status } = error;

      let message = '';

      if (!(error.data instanceof Blob)) {
        message = error.data.error.message;
      }
      if (error.data instanceof Blob) {
        error.data = {
          error: {
            statusCode: 422,
            name: 'DownloadXlsx Error',
            message: 'Error while genereation the file.',
          },
        };
      }
      const API_BLACKLIST_MESSAGE_TOASTR = [
        'password.error.format',
        'email.error.unique',
        'citizens.error.password.format',
        'citizens.error.email.unique',
        'citoyens.affiliation.not.valid',
        'citoyens.affiliation.bad.status',
        'citizens.affiliation.not.found',
        'citizen.email.error.unique',
      ];

      const showToaster: boolean =
        !API_BLACKLIST_MESSAGE_TOASTR.includes(message);
      if (status in StatusCode && !(error.data instanceof Blob))
        handleError(error, showToaster);
      else handleError(null, showToaster);

      return Promise.reject(error);
    } catch (e) {
      handleError(null);
      return Promise.reject(e);
    }
  }
}

export const http = new Http();
