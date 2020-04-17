const puppeteer = require('puppeteer');

// Grab full-screen shot of the webpage
// TODO: Queue any headless tasks to limit headless browser instances
const screenshot = async (url) => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto(url)

  // Possibly return the image? It needs to be processed
  await page.screenshot({path: `data/${hash(url)}.png`, fullPage: true})

  await browser.close()
}

// Grab all the text on the webpage
const getText = async (url) => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto(url)

  // Configured for raw github user content
  const text = await page.evaluate(
    'document.querySelector("pre").innerText'
  )

  await browser.close()
}

function hash(str) {
  var hash = 0
  for (i = 0; i < str.length; i++) {
    chr   = str.charCodeAt(i)
    hash  = ((hash << 5) - hash) + chr
    hash |= 0;
  }
  return hash
}

module.exports = {
  screenshot,getText
}