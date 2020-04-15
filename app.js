const puppeteer = require('puppeteer');

url = "https://github.com/tplagrange/code-scaper"
run(url)

// Potentially use a library like cheerio to reduce overhead of running all these browsers
function run(seed) {
  (async () => {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto(seed)

    // Get all links that are in form "github.com/user/repo"
    const hrefs = await page.$$eval('a', links => links.map(a => a.href))
    console.log(hrefs)

    await browser.close()
  })();
}

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