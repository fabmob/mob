/* eslint-disable */
import { regex } from 'react-admin';

export const validateUrl = regex(
  /^(?:http(s)?:\/\/)[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:%/?#[\]@!\$&'\(\)\*\+,;=.]+$/,
  'Entrez une url valide'
);
