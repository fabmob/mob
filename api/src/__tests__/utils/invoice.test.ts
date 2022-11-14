import {expect, sinon} from '@loopback/testlab';
import ejs from 'ejs';
import {generatePdfInvoices} from '../../utils/invoice';
import * as fileConversion from '../../utils/file-conversion';
import {Invoice} from '../../models';

const invoice1: Invoice = Object.assign(new Invoice(), {
  enterprise: {
    enterpriseName: 'IDF Mobilités',
    sirenNumber: '362521879',
    siretNumber: '36252187900034',
    apeCode: '4711D',
    enterpriseAddress: {
      zipCode: 75018,
      city: 'Paris',
      street: '6 rue Lepic',
    },
  },
  customer: {
    customerId: '123789',
    customerName: 'NEYMAR',
    customerSurname: 'Jean',
    customerAddress: {
      zipCode: 75018,
      city: 'Paris',
      street: '15 rue Veron',
    },
  },
  transaction: {
    orderId: '30723',
    purchaseDate: new Date('2021-03-03T14:54:18+01:00'),
    amountInclTaxes: 7520,
    amountExclTaxes: 7520,
  },
  products: [
    {
      productName: 'Forfait Navigo Mois',
      quantity: 1,
      amountInclTaxes: 7520,
      amountExclTaxes: 7520,
      percentTaxes: 10,
      productDetails: {
        periodicity: 'Mensuel',
        zoneMin: 1,
        zoneMax: 5,
        validityStart: new Date('2021-03-01T00:00:00+01:00'),
        validityEnd: new Date('2021-03-31T00:00:00+01:00'),
      },
    },
  ],
});

const invoice2: Invoice = Object.assign(new Invoice(), {
  enterprise: {
    enterpriseName: 'IDF Mobilités',
    sirenNumber: '362521879',
    siretNumber: '36252187900034',
    apeCode: '4711D',
    enterpriseAddress: {
      zipCode: 75018,
      city: 'Paris',
      street: '6 rue Lepic',
    },
  },
  customer: {
    customerId: '123789',
    customerName: 'DELOIN',
    customerSurname: 'Alain',
  },
  transaction: {
    orderId: '30723',
    purchaseDate: new Date('2021-03-03T14:54:18+01:00'),
    amountInclTaxes: 7520,
    amountExclTaxes: 7520,
  },
  products: [
    {
      productName: 'Forfait Navigo Mois',
      quantity: 1,
      amountInclTaxes: 7520,
      amountExclTaxes: 7520,
      percentTaxes: 10,
      productDetails: {
        periodicity: 'Mensuel',
        zoneMin: 1,
        zoneMax: 5,
      },
    },
  ],
});

const mockInvoices: Invoice[] = [invoice1, invoice2];
const files: Record<string, any>[] = [
  {key: 'file.txt'},
  {key: 'file.txt'},
  {key: 'file.txt'},
];
const mockHtml: string = `<html><body><div>Text Content</div></body></html>`;
const mockBuffer: Buffer = Buffer.from(mockHtml);
describe('Invoice', () => {
  it('generatePdfInvoices success', async () => {
    const ejsStub = sinon.stub(ejs, 'renderFile').resolves(mockHtml);
    sinon
      .stub(fileConversion, 'generatePdfBufferFromHtml')
      .resolves(Buffer.from(await ejsStub('')));
    const invoicesPdf = await generatePdfInvoices(mockInvoices);
    expect(invoicesPdf.length).to.equal(2);
    expect(invoicesPdf[0].originalname).to.equal(
      '03-03-2021_Forfait_Navigo_Mois_Jean_NEYMAR.pdf',
    );
    expect(invoicesPdf[1].originalname).to.equal(
      '03-03-2021_Forfait_Navigo_Mois_Alain_DELOIN.pdf',
    );
    expect(invoicesPdf[0].buffer).to.eql(mockBuffer);
  });
});
