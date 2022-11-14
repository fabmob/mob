export const idfm_invoice = {
  invoices: [
    {
      enterprise: {
        enterpriseName: 'IDF Mobilités', // Obligatoire
        sirenNumber: '362521879', // Facultatif
        siretNumber: '36252187900034', // Obligatoire
        apeCode: '4711D', // Facultatif
        enterpriseAddress: {
          // Facultatif
          zipCode: 75018, // Facultatif
          city: 'Paris', // Facultatif
          street: '6 rue Lepic', // Facultatif
        },
      },
      customer: {
        customerId: '123789', // Obligatoire  - Vérifier par IDFM si cette information peut être diffusable
        customerName: 'NABLI', // Obligatoire
        customerSurname: 'Samy', // Obligatoire
        customerAddress: {
          // Facultatif
          zipCode: 75018, // Facultatif
          city: 'Paris', // Facultatif
          street: '15 rue Veron', // Facultatif
        },
      },
      transaction: {
        orderId: '30723', // Obligatoire
        purchaseDate: '2021-03-03T14:54:18+01:00', // Obligatoire
        amountInclTaxes: 7520, // Obligatoire
        amountExclTaxes: 7520, // Facultatif
      },
      products: [
        {
          productName: 'Forfait Navigo Mois', // Obligatoire
          quantity: 1, // Obligatoire
          amountInclTaxes: 7520, // Obligatoire
          amountExclTaxes: 7520, // Facultatif
          percentTaxes: 10, // Facultatif
          productDetails: {
            // Facultatif
            periodicity: 'Mensuel', // Facultatif
            zoneMin: 1, // Facultatif
            zoneMax: 5, // Facultatif
            validityStart: '2021-03-01T00:00:00+01:00', // Facultatif
            validityEnd: '2021-03-31T00:00:00+01:00', // Facultatif
          },
        },
      ],
    },
  ],
  totalElements: 1,
};
