/* eslint-disable */
import {regex} from 'react-admin';
export const validatePassword = regex(
  process.env.REGEXP_PASSWORD ||
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&*!?.,_-]).{12,}$/,
  'Le mot de passe doit contenir au moins 12 caractères, une lettre majuscule, une lettre minuscule et un caractère spécial!'
 );

