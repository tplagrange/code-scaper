///////////////////////////////////////////
// Constants
///////////////////////////////////////////
const puppeteer = require('puppeteer');
const request = require('request');
const cheerio = require('cheerio');

const url = "https://github.com/avelino/awesome-go/blob/master/README.md";

const gitHubRepoRegex = /^https:\/\/github\.com\/(?!about\/|contact\/|features\/|nonprofit\/|pricing\/|site\/)[^\/]+\/\S[^\/]+$/;
const goFileRegex = /^(https:\/\/github\.com\/\S[^\/]+\/\S[^\/]+\/\S[^\.]+\.go)$/;

///////////////////////////////////////////
// Logic
///////////////////////////////////////////

run(url)

// TODO: Use cheerio where I don't need a headless browser


async function run(seed) {
  // Get all github repo links from seed
  const hrefs = await getGitHubRepos(seed)

  // Get all .go file links for each repo
  asyncForEach(hrefs, async (repo) => {
    const links = await getFileLinks(repo)
    // Now you can do something with each file page
    asyncForEach(links, async (link) => {
      await handleFile(link)
    })

  })
}

// TODO: This will have to be rate limited somehow, or think of an alternative
// Handle a file link
async function handleFile(link) {
  newLink = link.replace("https://github.com/", "https://raw.githubusercontent.com/")
  console.log(newLink)
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
  const hrefs = await getAllLinks(url)
  const repos = hrefs.flatMap( e => gitHubRepoRegex.exec(e)).filter( e => e != null)
  const dedupedRepos = [...new Set(repos)]

  return dedupedRepos
}

// For now I will get a dataset containing only .go files
async function getFileLinks(url) {
  nurl = url + "/search?l=go"
  const hrefs = await getAllLinks(nurl)
  const fixed = hrefs.filter( e => e.startsWith('/')).map( i => 'https://github.com' + i)
  const files = fixed.flatMap(e => goFileRegex.exec(e)).filter( i => i != null)

  return files
}

async function getAllLinks(url) {
  return new Promise((resolve, reject) => {
    request(url, (err, res, body) => {
      let hrefs = new Array()
      let $ = cheerio.load(body);
      $('a').each((i, link) => {
        const href = link.attribs.href;
        hrefs.push(href)
      })
      resolve(hrefs)
    })
  })
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}