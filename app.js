const puppeteer = require('puppeteer');

url = "https://raw.githubusercontent.com/tplagrange/fireteam-bot/master/api.go"
screenshot(url)
getText(url)

// Grab full-screen shot of the webpage
function screenshot(url) {
  (async () => {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto(url)

    // Possibly return the image? It needs to be processed
    await page.screenshot({path: 'example.png', fullPage: true})
   
    await browser.close()
  })();
}

// Grab all the text on the webpage
function getText(url) {
  (async () => {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto(url)

    // Configured for raw github user content
    const text = await page.evaluate(
      'document.querySelector("pre").innerText'
    )

    await browser.close()
  })();
}