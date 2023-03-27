import {Model, model, property} from '@loopback/repository';
import {City, Country, DateType, EmailType, PhoneNumber, PostalAddress, StringType} from '../cmsTypes.model';

@model({settings: {idInjection: false}})
export class Declarant extends Model {
  @property({
    type: StringType,
    description: 'Nom du déclarant',
  })
  lastName: StringType;

  @property({
    type: StringType,
    description: 'Nom de naissance du déclarant',
  })
  birthName: StringType;

  @property({
    type: StringType,
    description: 'Prénom du déclarant',
  })
  firstName: StringType;

  @property({
    type: StringType,
    description: 'Deuxièmes prénoms du déclarant',
  })
  middleNames: StringType;

  @property({
    type: DateType,
    description: 'Date de naissance du déclarant',
  })
  birthDate: DateType;

  @property({
    type: City,
    description: 'Lieu de naissance du déclarant',
  })
  birthPlace: City;

  @property({
    type: Country,
    description: 'Pays de naissance du déclarant',
  })
  birthCountry: Country;

  @property({
    type: EmailType,
    description: 'Email du déclarant',
  })
  email: EmailType;

  @property({
    type: PostalAddress,
    description: 'Première Adresse postale du déclarant',
  })
  primaryPostalAddress: PostalAddress;

  @property({
    type: PostalAddress,
    description: 'Deuxième adresse postale du déclarant',
  })
  secondaryPostalAddress: PostalAddress;

  @property({
    type: PhoneNumber,
    description: 'Numéro de téléphone du déclarant',
  })
  primaryPhoneNumber: PhoneNumber;

  constructor(data: Declarant) {
    super(data);
  }
}
