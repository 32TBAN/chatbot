import puppeteer from 'puppeteer';

const createHTML = (reportData) => {
  return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte de Cartera</title>
        <style>
          body {
            font-family: Arial, sans-serif;
          }
          .container {
            width: 80%;
            margin: 0 auto;
          }
          .chart {
            width: 100%;
            height: auto;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📊 Reporte de Cartera</h1>
          <h2>👥 Nuevos Clientes</h2>
          <p>${reportData.newClientsReport}</p>
          <h2>📂 Cartera Reportada</h2>
          <p>${reportData.reportedPortfolioReport}</p>
          <h2>💼 Cartera Cobrada</h2>
          <p>${reportData.collectedPortfolioReport}</p>
          <h2>📈 Gráficos</h2>
        </div>
      </body>
      </html>
    `;
};

const generatePDF = async (htmlContent) => {
    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
  
      await page.setDefaultNavigationTimeout(60000); 
  
      await page.setContent(htmlContent);
      const pdfBuffer = await page.pdf({ format: 'A4' });
  
      await browser.close();
      return pdfBuffer;
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      throw error;
    }
  };

export { createHTML, generatePDF };