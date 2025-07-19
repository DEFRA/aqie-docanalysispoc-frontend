import PDFParser from 'pdf2json';

export async function pdfParse(buffer) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on('pdfParser_dataError', errData => {
      reject(errData.parserError);
    });

    pdfParser.on('pdfParser_dataReady', pdfData => {
      const pages = pdfData.Pages.map((page, index) => ({
        pageNumber: index + 1,
        content: page.Texts.map(textObj =>
          decodeURIComponent(textObj.R[0]?.T ?? '')
        ).join(' ')
      }));

      resolve(pages);
    });

    pdfParser.parseBuffer(buffer);
  });
}