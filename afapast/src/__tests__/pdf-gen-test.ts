import { expect } from '@loopback/testlab';
import { Subscription, SUBSCRIPTION_STATUS } from '../services';
import { generateCertificatePdf } from '../utils/pdf-certificate-gen'
import fs from "fs"

describe('pdf-certificate-gen', () => {
  const subscription : Subscription = {
    id: '66e449e9b26ab5652cefa0cc',
    incentiveId: '66e3290d74df3754b04fab9f',
    funderName: 'La Fabrique des Mobilités',
    incentiveType: 'AideEmployeur',
    incentiveTitle: 'Aide employeur',
    incentiveTransportList: [ 'transportsCommun' ],
    citizenId: '802ac8b1-cde8-42f2-b310-a1c0380018d8',
    lastName: 'BOUCHON',
    firstName: 'Didier Lucien Gabriel',
    email: 'test@yopmail.com',
    city: 'Paris',
    postcode: '75000',
    birthdate: '1961-10-18T00:00:00.000Z',
    status: SUBSCRIPTION_STATUS.VALIDATED,
    createdAt: '2024-09-13T14:19:21.361Z',
    updatedAt: '2024-09-13T14:21:57.874Z',
    funderId: '2219e721-ac71-4a65-a202-37675c74ba58',
    subscriptionValidation: { mode: 'aucun' },
    specificFields: { textelibre: 'libre' },
    isCitizenDeleted: false,
    enterpriseEmail: 'willnotworkanyway@yopmail.com',
    consent: true
  }
  
  it('should generate a pdf buffer', async () => {
    const pdfBuffer = await generateCertificatePdf(subscription)
    expect(pdfBuffer).not.to.be.null
    // fs.writeFileSync('attestation_employeur.pdf', pdfBuffer)
  });
});
