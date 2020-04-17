const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const request = require('request');

const url = require('./url.js')
const seed = "https://github.com/avelino/awesome-go/blob/master/README.md";

run(seed)

async function run(seed) {
  // Measure
  const start = new Date()
  const hrstart = process.hrtime()

  // let hrefs = new Array()
  // hrefs.push("https://github.com/tplagrange/lf")
  // hrefs.push("https://github.com/tplagrange/fireteam-bot")
  const hrefs = await url.getGitHubRepos(seed)
  if (hrefs.length == 0) {
    console.log("[ERROR] No GitHub Repos!")
    return
  }

  const links = await processArray(hrefs, url.getFileLinks)
  const files = await processArray(links, handleFile)

  const end = new Date() - start
  const hrend = process.hrtime(hrstart)
  console.info(`Processed ${links.length} file URLs`)
  console.info('Execution time: %dms', end)
  console.info('Execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000000)
}

// Here's where we can kick off any work to be done on a code page
// TODO: This will have to be rate limited somehow, or think of an alternative
async function handleFile(link) {
  // TODO: Replacing /blob/ might be a problem if a repo or user is called blob, replacing the last instance would work
  const newLink = link.replace("https://github.com/", "https://raw.githubusercontent.com/").replace("/blob/", "/")
  // await screenshot(newLink)
  return newLink
}

async function processArray(array, mapper) {
  const promises = array.map(mapper)
  const final = await Promise.all(promises).then(e => {
    const flat = e.flatMap(f => f)
    return flat
  })
  return final
}