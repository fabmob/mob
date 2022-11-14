import {model, Model, property} from '@loopback/repository';

@model()
class ProductDetails extends Model {
  @property({
    type: 'string',
    description: 'Fréquence',
    jsonSchema: {
      example: `Mensuel`,
    },
  })
  periodicity: string;

  @property({
    type: 'number',
    description: 'Zone minimum',
    jsonSchema: {
      example: 1,
    },
  })
  zoneMin: number;

  @property({
    type: 'number',
    description: 'Zone maximum',
    jsonSchema: {
      example: 5,
    },
  })
  zoneMax: number;

  @property({
    description: 'Date de début',
    jsonSchema: {
      example: `2021-03-01T00:00:00+01:00`,
    },
  })
  validityStart: Date;

  @property({
    description: 'Date de fin',
    jsonSchema: {
      example: `2021-03-31T00:00:00+01:00`,
    },
  })
  validityEnd: Date;

  constructor(data?: Partial<ProductDetails>) {
    super(data);
  }
}

@model()
class Address extends Model {
  @property({
    type: 'number',
    description: 'Code postal',
    jsonSchema: {
      example: 75018,
    },
  })
  zipCode: number;

  @property({
    type: 'string',
    description: 'Ville',
    jsonSchema: {
      example: `Paris`,
    },
  })
  city: string;

  @property({
    type: 'string',
    description: 'Rue',
    jsonSchema: {
      example: `6 rue Lepic`,
    },
  })
  street: string;

  constructor(data?: Partial<Address>) {
    super(data);
  }
}

@model()
class EnterpriseData extends Model {
  @property({
    type: 'string',
    description: `Nom de l'entreprise`,
    required: true,
    jsonSchema: {
      example: `IDFM`,
    },
  })
  enterpriseName: string;

  @property({
    type: 'string',
    description: `N° SIREN`,
    jsonSchema: {
      example: `362521879`,
    },
  })
  sirenNumber: string;

  @property({
    type: 'string',
    description: `N° SIRET`,
    jsonSchema: {
      example: `36252187900034`,
    },
    required: true,
  })
  siretNumber: string;

  @property({
    type: 'string',
    description: `Code APE`,
    jsonSchema: {
      example: `4711D`,
    },
  })
  apeCode: string;

  @property() enterpriseAddress: Address;

  constructor(data?: Partial<EnterpriseData>) {
    super(data);
  }
}

@model()
class CustomerData extends Model {
  @property({
    type: 'string',
    description: `N° de client`,
    required: true,
    jsonSchema: {
      example: ``,
    },
  })
  customerId: string;

  @property({
    type: 'string',
    description: `Nom du client`,
    required: true,
    jsonSchema: {
      example: `RASOVSKY`,
    },
  })
  customerName: string;

  @property({
    type: 'string',
    description: `Prénom du client`,
    required: true,
    jsonSchema: {
      example: `Bob`,
    },
  })
  customerSurname: string;

  @property() customerAddress: Address;

  constructor(data?: Partial<CustomerData>) {
    super(data);
  }
}

@model()
class TransactionData extends Model {
  @property({
    type: 'string',
    description: `N° de commande`,
    jsonSchema: {
      example: ``,
    },
    required: true,
  })
  orderId: string;

  @property({
    type: 'date',
    description: `Date d'achat`,
    required: true,
    jsonSchema: {
      example: `2021-03-03T14:54:18+01:00`,
    },
  })
  purchaseDate: Date;

  @property({
    type: 'number',
    description: `Prix TTC`,
    required: true,
    jsonSchema: {
      example: 2100,
    },
  })
  amountInclTaxes: number;

  @property({
    type: 'number',
    description: `Prix HT`,
    jsonSchema: {
      example: 2100,
    },
  })
  amountExclTaxes: number;

  constructor(data?: Partial<TransactionData>) {
    super(data);
  }
}

@model()
class ProductData extends Model {
  @property({
    type: 'string',
    description: `Nom du produit`,
    required: true,
    jsonSchema: {
      example: `Forfait Navigo Mois`,
    },
  })
  productName: string;

  @property({
    type: 'number',
    description: `Quantité`,
    required: true,
    jsonSchema: {
      example: 1,
    },
  })
  quantity: number;

  @property({
    type: 'number',
    description: `Prix TTC`,
    required: true,
    jsonSchema: {
      example: 7520,
    },
  })
  amountInclTaxes: number;

  @property({
    type: 'number',
    description: `Prix HT`,
    jsonSchema: {
      example: 7520,
    },
  })
  amountExclTaxes: number;

  @property({
    type: 'number',
    description: `Taux de TVA`,
    jsonSchema: {
      example: 10,
    },
  })
  percentTaxes: number;

  @property() productDetails: ProductDetails;

  constructor(data?: Partial<ProductData>) {
    super(data);
  }
}

@model()
export class Invoice extends Model {
  @property({required: true}) enterprise: EnterpriseData;

  @property({required: true}) customer: CustomerData;

  @property({required: true}) transaction: TransactionData;

  @property.array(ProductData, {required: true}) products: ProductData[];

  constructor(data?: Partial<Invoice>) {
    super(data);
  }
}

@model()
export class AttachmentMetadata extends Model {
  @property.array(Invoice, {required: true}) invoices: Invoice[];

  @property({
    required: true,
    jsonSchema: {
      example: 1,
    },
  })
  totalElements: number;

  constructor(data?: Partial<AttachmentMetadata>) {
    super(data);
  }
}
