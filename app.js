const progress = require('cli-progress')
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const request = require('request');

const { Worker } = require('worker_threads')

const seed = "https://github.com/avelino/awesome-go/blob/master/README.md";

const gitHubRepoRegex = /^https:\/\/github\.com\/(?!about\/|contact\/|features\/|nonprofit\/|pricing\/|site\/)[^\/]+\/\S[^\/]+$/;
const goFileRegex = /^(https:\/\/github\.com\/\S[^\/]+\/\S[^\/]+\/\S[^\.]+\.go)$/;

///////////////////////////////////////////
// Logic
///////////////////////////////////////////

// run(seed)
run(seed)

async function lite(seed) {
  let hrefs = new Array()
  hrefs.push("https://github.com/spf13/pflag")
  hrefs.push("https://github.com/chzyer/readline")

  const links = await processArray(hrefs, getFileLinks)
  const files = await processArray(links, handleFile)
  console.log(files)
}

// TODO: Use cheerio where I don't need a headless browser
async function run(seed) {
  // Measure
  const start = new Date()
  const hrstart = process.hrtime()

  const hrefs = await getGitHubRepos(seed)
  if (hrefs.length == 0) {
    console.log("[ERROR] No GitHub Repos!")
    return
  }
  const links = await processArray(hrefs, getFileLinks)
  const files = await processArray(links, handleFile)

  const end = new Date() - start
  const hrend = process.hrtime(hrstart)

  console.info(`Processed ${links.length} file URLs`)
  console.info('Execution time: %dms', end)
  console.info('Execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000000)
}

async function processArray(array, mapper) {
  const promises = array.map(mapper)
  const final = await Promise.all(promises).then(e => {
    const flat = e.flatMap(f => f)
    return flat
  })
  return final
}

// Here's where we can kick off any work to be done on a code page
// TODO: This will have to be rate limited somehow, or think of an alternative
async function handleFile(link) {
  // TODO: Replacing /blob/ might be a problem if a repo or user is called blob, replacing the last instance would work
  const newLink = link.replace("https://github.com/", "https://raw.githubusercontent.com/").replace("/blob/", "/")
  return newLink
}

// Grab full-screen shot of the webpage
async function screenshot(url) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto(url)

  // Possibly return the image? It needs to be processed
  await page.screenshot({path: 'example.png', fullPage: true})
  // const image = await page.screenshot({fullPage: true})
  // const compressed = await compressImage(image)

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
  const deduped = [...new Set(files)]

  return deduped
}

async function getAllLinks(url) {
  return new Promise((resolve, reject) => {
    request(url, (err, res, body) => {
      if (err) {
        console.log(err)
      }
      let hrefs = new Array()
      if (!(body)) {
        resolve(hrefs)
        return
      }
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
