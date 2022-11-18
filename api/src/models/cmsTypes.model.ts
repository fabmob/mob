import {Entity, Model, model, property} from '@loopback/repository';
import {emailRegexp} from '../constants';
import {GENDER_TYPE} from '../utils/enum';

@model({settings: {idInjection: false}})
export class CommonFields extends Entity {
  @property({
    type: 'string',
    description: 'Name of the service requested to certify data',
    jsonSchema: {
      example: 'franceconnect.gouv.fr',
    },
  })
  source: string;

  @property({
    type: 'date',
    description: 'Last certification date',
    jsonSchema: {
      example: '2022-06-17T14:22:01Z',
    },
  })
  certificationDate: Date;

  constructor(data?: Partial<CommonFields>) {
    super(data);
  }
}

@model({settings: {idInjection: false}})
export class BooleanType extends CommonFields {
  @property({
    type: 'boolean',
    required: true,
    description: 'Boolean value',
    jsonSchema: {
      example: true,
    },
  })
  value: boolean;

  constructor(data: BooleanType) {
    super(data);
  }
}

@model({settings: {idInjection: false}})
export class StringType extends CommonFields {
  @property({
    type: 'string',
    required: true,
    description: 'String value',
    jsonSchema: {
      example: 'test',
      minLength: 2,
    },
  })
  value: string;

  constructor(data: StringType) {
    super(data);
  }
}

@model({settings: {idInjection: false}})
export class IntegerType extends CommonFields {
  @property({
    type: 'number',
    required: true,
    description: 'Integer value',
    jsonSchema: {
      example: 10,
      format: 'int32',
    },
  })
  value: number;

  constructor(data: IntegerType) {
    super(data);
  }
}

@model({settings: {idInjection: false}})
export class NumberType extends CommonFields {
  @property({
    type: 'number',
    required: true,
    description: 'Number value',
    jsonSchema: {
      example: 12345,
    },
  })
  value: number;

  constructor(data: NumberType) {
    super(data);
  }
}

@model({settings: {idInjection: false}})
export class DateType extends CommonFields {
  @property({
    type: 'date',
    required: true,
    description: 'Date value',
    jsonSchema: {
      example: '2022-06-17',
      format: 'date',
    },
  })
  value: string;

  constructor(data: DateType) {
    super(data);
  }
}

@model({settings: {idInjection: false}})
export class EmailType extends CommonFields {
  @property({
    type: 'string',
    required: true,
    description: 'Email address',
    jsonSchema: {
      example: 'bob@yopmail.com',
      format: 'email',
      pattern: emailRegexp,
    },
  })
  value: string;

  constructor(data: EmailType) {
    super(data);
  }
}

@model({settings: {idInjection: false}})
export class PostalAddressValue extends Model {
  @property({
    type: 'string',
    required: true,
    description: 'Address - Line 1',
    jsonSchema: {
      example: 'M Dr Jean Dupont',
      maxLength: 38,
    },
  })
  line1: string;

  @property({
    type: 'string',
    description: 'Address - Line 2',
    jsonSchema: {
      example: 'Etage 1',
      maxLength: 38,
    },
  })
  line2: string;

  @property({
    type: 'string',
    description: 'Address - Line 3',
    jsonSchema: {
      example: 'Bâtiment A',
      maxLength: 38,
    },
  })
  line3: string;

  @property({
    type: 'string',
    description: 'Address - Line 4',
    jsonSchema: {
      example: '7 Rue Claude Chappe',
      maxLength: 38,
    },
  })
  line4: string;

  @property({
    type: 'string',
    description: 'Address - Line 5',
    jsonSchema: {
      example: 'Rennes Atalante Champs Blancs CS 67746',
      maxLength: 38,
    },
  })
  line5: string;

  @property({
    type: 'string',
    description: 'Address - Line 6',
    jsonSchema: {
      example: '35510 Cesson-Sévigné',
      maxLength: 38,
    },
  })
  line6: string;

  @property({
    type: 'string',
    description: 'Address - Line 7',
    jsonSchema: {
      example: 'FRANCE',
      maxLength: 38,
    },
  })
  line7: string;

  constructor(data: PostalAddressValue) {
    super(data);
  }
}

@model({settings: {idInjection: false}})
export class PostalAddress extends CommonFields {
  @property({
    type: PostalAddressValue,
    required: true,
    description: 'Postal Address',
  })
  value: PostalAddressValue;

  constructor(data: PostalAddressValue) {
    super(data);
  }
}

@model({settings: {idInjection: false}})
export class PhoneNumber extends CommonFields {
  @property({
    type: 'string',
    required: true,
    description: 'International Phone number',
    jsonSchema: {
      example: '+33123456789',
      pattern: '^\\+[1-9]\\d{1,14}$',
    },
  })
  value: string;

  @property({
    type: 'boolean',
    description: 'Is a mobile phone number',
    jsonSchema: {
      example: false,
    },
  })
  mobile: boolean;

  constructor(data: PhoneNumber) {
    super(data);
  }
}

@model({settings: {idInjection: false}})
export class Gender extends CommonFields {
  @property({
    type: 'number',
    required: true,
    description: 'Gender ISO/IEC 5218 value',
    jsonSchema: {
      example: GENDER_TYPE.MALE,
      enum: Object.values(GENDER_TYPE).filter(x => typeof x === 'number'),
      minLength: 2,
    },
  })
  value: GENDER_TYPE;

  constructor(data: Gender) {
    super(data);
  }
}

@model({settings: {idInjection: false}})
export class Country extends CommonFields {
  @property({
    type: 'string',
    description: 'Country name',
    jsonSchema: {
      example: 'France',
    },
  })
  value: string;

  @property({
    type: 'string',
    description: 'Country ISO 3166-1 alpha-3 value',
    jsonSchema: {
      example: 'FRA',
    },
  })
  isoValue: string;

  constructor(data: Country) {
    super(data);
  }
}

@model({settings: {idInjection: false}})
export class City extends CommonFields {
  @property({
    type: 'string',
    description: 'City INSEE value',
    jsonSchema: {
      example: '',
    },
  })
  inseeValue: string;

  @property({
    type: 'string',
    description: 'Name of the city',
    jsonSchema: {
      example: 'Paris',
    },
  })
  name: string;

  constructor(data: City) {
    super(data);
  }
}
