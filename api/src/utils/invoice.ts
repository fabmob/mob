import {Invoice} from '../models';
import {generatePdfBufferFromHtml, generateTemplateAsHtml} from '../utils';
import {formatDateInTimezone} from './date';
import {Express} from 'express';

export const generatePdfInvoices = async (
  invoices: Invoice[],
): Promise<Express.Multer.File[]> => {
  const invoicesPdf: Express.Multer.File[] = [];
  for (const invoice of invoices) {
    const html = await generateTemplateAsHtml('invoice', {
      invoice: invoice,
      formatDate: formatDateInTimezone,
    });
    const invoicePdfBuffer = await generatePdfBufferFromHtml(html);
    invoicesPdf.push({
      originalname: getInvoiceFilename(invoice),
      buffer: invoicePdfBuffer,
      mimetype: 'application/pdf',
      fieldname: 'invoice',
    } as Express.Multer.File);
  }
  return invoicesPdf;
};

export const getInvoiceFilename = (invoice: Invoice): string => {
  const productName = `${invoice.products[0].productName}`;
  const customerSurname = `${invoice.customer.customerSurname}`;
  const customerName = `${invoice.customer.customerName}`;

  const purchaseDate = formatDateInTimezone(
    invoice.transaction.purchaseDate,
    'dd-MM-yyyy',
  );
  const fileName = `${purchaseDate}_${productName}_${customerSurname}_${customerName}.pdf`;
  return fileName.replace(/ /g, '_');
};
