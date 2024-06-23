import puppeteer from "puppeteer";

// * Función para generar el PDF
const generatePDF = async (htmlContent) => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  await page.setDefaultNavigationTimeout(60000);

  await page.setContent(htmlContent, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({ format: "A4" });
  await browser.close();
  return pdfBuffer;
};

export { generatePDF };
