///////////////////////////////////////////
// Variables
///////////////////////////////////////////
const puppeteer = require('puppeteer');
const url = "https://github.com/avelino/awesome-go/blob/master/README.md";

const gitHubRepoRegex = /^https:\/\/github\.com\/(?!about\/|contact\/|features\/|pricing\/|site\/)[^\/]+\/\S[^\/]+$/;
const goFileRegex = /^(https:\/\/github\.com\/\S[^\/]+\/\S[^\/]+\/\S[^\.]+\.go)$/;

///////////////////////////////////////////
// Logic
///////////////////////////////////////////

run(url)


// TODO: Use cheerio where I don't need a headless browser


async function run(seed) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto(seed)

  // Get all links that are in form "github.com/user/repo"
  const hrefs = await getGitHubRepos(seed)

  asyncForEach(hrefs, async (e) => {
    const links = await getRawFileLinks(e)
    console.log(links)
  })

  await browser.close()
}

// Grab full-screen shot of the webpage
async function screenshot(url) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto(url)

  // Possibly return the image? It needs to be processed
  await page.screenshot({path: 'example.png', fullPage: true})
 
  await browser.close()
}

// Grab all the text on the webpage
async function getText(url) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto(url)

  // Configured for raw github user content
  const text = await page.evaluate(
    'document.querySelector("pre").innerText'
  )

  await browser.close()
}

async function getGitHubRepos(url) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto(url)

  const hrefs = await page.$$eval('a', links => links.map(a => a.href))
  const repos = hrefs.flatMap(x => gitHubRepoRegex.exec(x)).filter( e => e != null)
  const dedupedRepos = [...new Set(repos)]

  await browser.close()
  return dedupedRepos
}

// For now I will get a dataset containing only .go files
async function getRawFileLinks(url) {
  url = url + "/search?l=go"

  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto(url)

  const hrefs = await page.$$eval('a', links => links.map(a => a.href))
  const files = hrefs.flatMap(x => goFileRegex.exec(x)).filter( e => e != null)

  await browser.close()
  return files
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}