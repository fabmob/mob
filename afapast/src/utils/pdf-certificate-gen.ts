import { Subscription } from '../services/mob.service';
import PDFDocument from 'pdfkit'
import { PassThrough } from 'stream'
import path from 'path';


const generateHeader = (doc: PDFKit.PDFDocument) => {
    const imagePath = path.join(__dirname, '../utils/mob.png');
    doc
        .image(imagePath, 50, 45, { width: 50 })
        .fillColor("#444444")
        .fontSize(15)
        .text("Mon Compte Mobilité", 110, 57)
        .fontSize(10)
        .text("https://moncomptemobilite.fr", 200, 50, { align: "right", link: "https://moncomptemobilite.fr" })
        .moveDown();
  }
const generateHr = (doc: PDFKit.PDFDocument, y: number) => {
    doc
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke();
}

export const generateCertificatePdf = async (subscription: Subscription) => {
    const doc = new PDFDocument();

    // Pipe the PDF document to a PassThrough stream
    const stream = new PassThrough();
    doc.pipe(stream);
  
    // Add content to the PDF
    generateHeader(doc)
    doc
        .fillColor("#444444")
        .fontSize(15)
        .text("Objet: Attestation employeur de " + subscription.firstName + " " + subscription.lastName, 50, 160);

    generateHr(doc, 185);
    doc.moveDown()
    doc
        .fontSize(10)
        .text("Ce document est généré automatiquement par le service Mon Compte Mobilité suite à une validation manuelle par un responsable de " + subscription.funderName + ".", 50)
        .moveDown()

        .text("Il agit de fait comme une attestation que " + subscription.firstName + " " + subscription.lastName + " est actuellement employé chez " + subscription.funderName + ".", 50)
        .moveDown()

        .text("Cette attestation marque l'autorisation de prise en charge de l'aide " + subscription.incentiveTitle + ", avec la modalité: " + subscription.specificFields!["Type d'abonnement"] + ".", 50)
        .moveDown()

        .text("Date de la validation : " + new Date(subscription.updatedAt).toLocaleString("FR-fr") + ".", 50)
    
    
    // Finalize the PDF and close the stream
    doc.end();
  
    // Convert the stream to a buffer
    const pdfBuffer : Buffer = await new Promise((resolve, reject) => {
      const chunks : Uint8Array[] = [];
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
    return pdfBuffer
}