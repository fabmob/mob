import {Model, model, property} from '@loopback/repository';
import {EmailType, PostalAddress, PhoneNumber} from '../cmsTypes.model';

@model({settings: {idInjection: false}})
export class PersonalInformation extends Model {
  @property({
    description: 'Email du citoyen',
    required: true,
  })
  email: EmailType;

  @property({
    description: 'adresse postal du citoyen',
  })
  primaryPostalAddress: PostalAddress;

  @property({
    description: 'adresse postal secondaire du citoyen',
  })
  secondaryPostalAddress: PostalAddress;

  @property({
    description: 'Numéro du téléphone du citoyen',
  })
  primaryPhoneNumber: PhoneNumber;

  @property({
    description: 'Numéro du téléphone secondaire du citoyen',
  })
  secondaryPhoneNumber: PhoneNumber;

  constructor(personalInformation: PersonalInformation) {
    super(personalInformation);
  }
}
