import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { handleError } from './handleError';
import toast from 'react-hot-toast';
import Strings from './locale/fr.json';
import { environment } from '../environment';

// I wrote this code to prevent console logging errors coming from apis
const API = `${process.env.PATH_API || 'http://localhost:3000'}`;
const API_KEY = `${environment.API_KEY || 'apikey'}`;

// We give all type of status code in this enum declaration
export enum StatusCode {
  BadRequest = 400,
  Forbidden = 403,
  NotFound = 404,
  Conflict = 409,
  UnsupportedMediaType = 415,
  UnprocessableEntity = 422,
}

const headers: Readonly<Record<string, string | boolean>> = {
  Accept: 'application/json',
  'Content-Type': 'application/json; charset=utf-8',
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

    if (token !== 'undefined' && token !== null) {
      config.headers.Authorization = `Bearer ${token}`;
      delete config.headers['X-API-Key'];
    }
    return config;
  } catch (error: any) {
    throw new Error(error);
  }
};

class Https {
  private instance: AxiosInstance | null = null;
  private toastCounter = 0;
  private toastId = '';

  private get https(): AxiosInstance {
    return this.instance != null ? this.instance : this.initHttp();
  }

  initHttp() {
    const https = axios.create({
      baseURL: API,
      headers,
      withCredentials: false,
    });

    https.interceptors.request.use(
      (config) => {
        //this.showToaster();
        return injectToken(config);
      },
      (error) => Promise.reject(error)
    );

    https.interceptors.response.use(
      (response) => {
        //this.dismissToaster();
        return response;
      },
      (error) => {
        //this.dismissToaster();
        const { response } = error;
        return this.handleError(response);
      }
    );

    this.instance = https;
    return https;
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
    return this.https.request(config);
  }

  // GET method
  get<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<R> {
    return this.https.get<T, R>(url, config);
  }

  // POST method
  post<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: T,
    config?: AxiosRequestConfig
  ): Promise<R> {
    return this.https.post<T, R>(url, data, config);
  }

  // PUT method
  put<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: T,
    config?: AxiosRequestConfig
  ): Promise<R> {
    return this.https.put<T, R>(url, data, config);
  }

  // PATCH method
  patch<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: T,
    config?: AxiosRequestConfig
  ): Promise<R> {
    return this.https.patch<T, R>(url, data, config);
  }

  // Head Method
  head<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<R> {
    return this.https.head<T, R>(url, config);
  }

  // Last but not least DELETE method
  delete<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<R> {
    return this.https.delete<T, R>(url, config);
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
            statusCode: 400,
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
        'citizens.affiliation.not.valid',
        'citizens.affiliation.bad.status',
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

export const https = new Https();
