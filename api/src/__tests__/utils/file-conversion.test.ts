import {expect, sinon} from '@loopback/testlab';
import pdf from 'html-pdf';
import ejs from 'ejs';
import {generatePdfBufferFromHtml, generateTemplateAsHtml} from '../../utils';
import {Invoice} from '../../models';
import {formatDateInTimezone} from '../../utils/date';

const mockInvoice: Invoice = Object.assign(new Invoice(), {
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
const mockHtml: string = `<html><body><div>Text Content</div></body></html>`;
const mockBuffer: Buffer = Buffer.from(mockHtml);

describe('File conversion functions', () => {
  it('generateTemplateAsHtml success', async () => {
    const html = await generateTemplateAsHtml('invoice', {
      invoice: mockInvoice,
      formatDate: formatDateInTimezone,
    });
    expect(html).to.containEql(mockInvoice.customer.customerName);
    expect(html).to.containEql(mockInvoice.customer.customerSurname);
    expect(html).to.containEql(mockInvoice.enterprise.enterpriseName);
    expect(html).to.containEql(mockInvoice.enterprise.siretNumber);
    expect(html).to.containEql(
      (mockInvoice.transaction.amountInclTaxes / 100).toFixed(2),
    );
    expect(html).to.containEql(mockInvoice.transaction.orderId);
    expect(html).to.containEql(
      formatDateInTimezone(mockInvoice.transaction.purchaseDate, 'dd/MM/yyyy'),
    );
    expect(html).to.containEql(mockInvoice.products[0].productName);
  });

  it('generateTemplateAsHtml should throw error', async () => {
    const ejsStub = sinon.stub(ejs, 'renderFile').rejects('HtmlTemplateError');
    try {
      await generateTemplateAsHtml('invoice');
    } catch (error) {
      expect(error.message).to.equal('HtmlTemplateError');
    }
    ejsStub.restore();
  });

  it('generatePdfBufferFromHtml success', async () => {
    const pdfStub = sinon.stub(pdf, 'create').returns({
      toBuffer: sinon.stub().yields(null, Buffer.from(mockHtml)),
      toFile: sinon.stub().returnsThis(),
      toStream: sinon.stub().returnsThis(),
    });
    const pdfBuffer = await generatePdfBufferFromHtml(mockHtml);
    expect(pdfBuffer).to.eql(mockBuffer);
    pdfStub.restore();
  });

  it('generatePdfBufferFromHtml should throw error', async () => {
    const pdfStub = sinon.stub(pdf, 'create').returns({
      toBuffer: sinon.stub().yields('generatePdfError', null),
      toFile: sinon.stub().returnsThis(),
      toStream: sinon.stub().returnsThis(),
    });
    try {
      await generatePdfBufferFromHtml(mockHtml);
    } catch (error) {
      expect(error).to.equal('generatePdfError');
    }
    pdfStub.restore();
  });
});
