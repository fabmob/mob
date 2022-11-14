import {Model, model, property} from '@loopback/repository';
import {StringType, Gender, DateType, City, Country} from '../cmsTypes.model';

@model({settings: {idInjection: false}})
export class Identity extends Model {
  @property({
    description: 'Nom de famille du citoyen',
    required: true,
  })
  lastName: StringType;

  @property({
    description: 'Prénom du citoyen',
    required: true,
  })
  firstName: StringType;

  @property({
    description: 'Deuxième prénom du citoyen',
  })
  middleNames?: StringType;

  @property({
    description: 'Sexe du citoyen',
    required: true,
  })
  gender: Gender;

  @property({
    description: 'Date de naissance du citoyen',
    required: true,
  })
  birthDate: DateType;

  @property({
    description: 'Lieu de naissance du citoyen',
  })
  birthPlace?: City;

  @property({
    description: 'Pays de naissance du citoyen',
  })
  birthCountry?: Country;

  constructor(identity: Identity) {
    super(identity);
  }
}
