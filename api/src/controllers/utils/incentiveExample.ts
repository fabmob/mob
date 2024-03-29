export const incentiveExample = [
  {
    id: '',
    title: 'Aide pour acheter vélo électrique',
    description: `Sous conditions d'éligibilité,\
    Mulhouse met à disposition une aide au financement d'un vélo électrique`,
    territoryIds: [''],
    funderName: 'Mulhouse',
    incentiveType: 'AideTerritoire',
    conditions: "Fournir une preuve d'achat d'un vélo électrique",
    paymentMethod: 'Remboursement par virement',
    allocatedAmount: '500 €',
    minAmount: '50 €',
    transportList: ['electrique'],
    attachments: ['Justificatif de domicile'],
    additionalInfos: 'Aide mise à disposition uniquement pour les habitants de Mulhouse',
    contact: 'Contactez le numéro vert au 05 206 308',
    validityDuration: '12 mois',
    validityDate: '2024-07-31',
    isMCMStaff: false,
    isCertifiedTimestampRequired: false,
    subscriptionLink: 'https://www.mulhouse.com',
    createdAt: '2022-01-01 00:00:00.000Z',
    updatedAt: '2022-01-02 00:00:00.000Z',
    funderId: '25eb2670-7984-4ff8-b43c-515a694edfe0',
  },
  {
    id: '',
    title: 'Aide pour acheter scooter électrique',
    description: `Sous conditions d'éligibilité,\
    Capgemini Toulouse met à disposition une aide au financement d'un scooter électrique`,
    territoryIds: [''],
    funderName: 'Capgemini',
    incentiveType: 'AideEmployeur',
    conditions: "Fournir une preuve d'achat d'un scooter électrique",
    paymentMethod: 'Remboursement par virement',
    allocatedAmount: '500 €',
    minAmount: '50 €',
    transportList: ['electrique'],
    attachments: ['identite', 'factureAchat'],
    additionalInfos: 'Aide mise à disposition uniquement pour les habitants de Toulouse',
    contact: 'Contactez le numéro vert au 05 206 308',
    validityDuration: '12 mois',
    validityDate: '2024-07-31',
    isMCMStaff: false,
    isCertifiedTimestampRequired: false,
    subscriptionLink: 'https://www.capgemini.com',
    createdAt: '2022-01-01 00:00:00.000Z',
    updatedAt: '2022-01-02 00:00:00.000Z',
    funderId: '93a294b9-4ac3-483d-9831-ebe6e3609c29',
  },
  {
    id: '',
    title: 'Bonus écologique',
    description: `Profiter d'un bonus écologique pour les personnes,\
    qui souhaitent acquérir une voiture électrique ou hybride`,
    territoryIds: [''],
    funderName: 'État français',
    incentiveType: 'AideNationale',
    conditions: 'Acheter une voiture hybride ou électrique à compter du 1er janvier 2022',
    paymentMethod: `Aide de l'état`,
    allocatedAmount: '500 €',
    minAmount: '1000 €',
    transportList: ['voiture'],
    attachments: ['identite', 'factureAchat'],
    additionalInfos: 'Aide mise à disposition uniquement pour les habitants de Toulouse',
    contact: 'Contactez le numéro vert au 05 206 308',
    validityDuration: '12 mois',
    validityDate: '2024-07-31',
    isMCMStaff: false,
    isCertifiedTimestampRequired: false,
    subscriptionLink: 'www.primealaconversion.gouv.fr',
    createdAt: '2022-01-01 00:00:00.000Z',
    updatedAt: '2022-01-02 00:00:00.000Z',
  },
  {
    id: '',
    title: 'Le vélo électrique arrive à Mulhouse !',
    description: `Sous conditions d'éligibilité,\
    Mulhouse met à disposition une aide au financement d'un vélo électrique`,
    territoryIds: [''],
    funderName: 'Mulhouse',
    incentiveType: 'AideTerritoire',
    conditions: "Fournir une preuve d'achat d'un vélo électrique",
    paymentMethod: 'Remboursement par virement',
    allocatedAmount: '500 €',
    minAmount: '50 €',
    transportList: ['electrique'],
    attachments: ['Justificatif de domicile'],
    additionalInfos: 'Aide mise à disposition uniquement pour les habitants de Mulhouse',
    contact: 'Contactez le numéro vert au 05 206 308',
    validityDuration: '12 mois',
    validityDate: '2024-07-31',
    isMCMStaff: true,
    isCertifiedTimestampRequired: false,
    specificFields: [
      {
        title: 'Statut marital',
        inputFormat: 'listeChoix',
        choiceList: {
          possibleChoicesNumber: 1,
          inputChoiceList: [
            {
              inputChoice: 'Marié',
            },
          ],
        },
      },
    ],
    jsonSchema: {
      properties: {
        'Statut marital': {
          type: 'array',
          maxItems: 1,
          items: {
            enum: ['Marié', 'Célibataire'],
          },
        },
      },
      type: 'object',
      required: ['Statut marital'],
      additionalProperties: false,
    },
    createdAt: '2022-01-01 00:00:00.000Z',
    updatedAt: '2022-01-02 00:00:00.000Z',
    funderId: 'e13c5de9-d695-4c03-b7b7-9efdd13d937c',
  },
];
