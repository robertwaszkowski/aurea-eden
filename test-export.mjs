import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    console.log('Navigating to demo...');
    await page.goto('http://localhost:5173/demo/BpmnConverterDemo/index.html', { waitUntil: 'networkidle0' });

    console.log('Intercepting createObjectURL...');
    await page.evaluate(() => {
        window.interceptedBlobText = null;
        const ogURL = URL.createObjectURL;
        URL.createObjectURL = function (blob) {
            const reader = new FileReader();
            reader.onload = function () {
                window.interceptedBlobText = reader.result;
            }
            reader.readAsText(blob);
            return ogURL.apply(this, arguments);
        };
    });

    console.log('Clicking the export button...');
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const exportBtn = buttons.find(b => b.innerText.includes('Export Auto-generated'));
        if (exportBtn) {
            exportBtn.click();
        } else {
            console.log('Export button not found!');
        }
    });

    console.log('Waiting for export...');
    await new Promise(r => setTimeout(r, 2000));

    const xml = await page.evaluate(() => window.interceptedBlobText);

    fs.writeFileSync('C:\\Users\\Robert\\Downloads\\puppeteer_exported_simple_process.bpmn', xml || 'NO_XML');

    await browser.close();
    console.log('Test completed, file saved to C:\\Users\\Robert\\Downloads\\puppeteer_exported_simple_process.bpmn');
})();
