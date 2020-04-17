const cheerio   = require('cheerio');
const fs        = require('fs')
const puppeteer = require('puppeteer');
const request   = require('request');

const headless = require('./headless.js')
const url    = require('./url.js')

const { Cluster } = require('puppeteer-cluster')

const seed = "https://github.com/avelino/awesome-go/blob/master/README.md";
const fonts = [ 'monospace', 'initial', 'sans-serif', 'menlo' ];

run(seed)

async function run(seed) {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 30,
    monitor: true,
    // puppeteerOptions: {
    //   dumpio: true,
    // },
  });

  // TODO: Abstract this to one task per font also
  await cluster.task(async ({ page, data: url }) => {
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const text = await page.evaluate('document.querySelector("pre").innerText');
    fs.writeFile(`data/raw/${hash(url)}.txt`, text, (err) => {
      if (err) throw err;
    });

    for (var i = 0; i < fonts.length; i++) {
      const font = fonts[i];
      await page.evaluate( (font) => {
        document.querySelector('pre').style = `font-family: ${font}`
      }, font);
      await page.screenshot({path: `data/raw/${hash(url)}-${font}.png`, fullPage: true});
    }
  });

  // Measure
  const start = new Date()
  const hrstart = process.hrtime()

  let hrefs = new Array()
  hrefs.push("https://github.com/tplagrange/lf")
  hrefs.push("https://github.com/tplagrange/fireteam-bot")
  // const hrefs = await url.getGitHubRepos(seed)
  // if (hrefs.length == 0) {
  //   console.log("[ERROR] No GitHub Repos!")
  //   await cluster.close()
  //   return process.exit(1)
  // }

  // const links = await processArray(hrefs, url.getFileLinks)
  // const files = await processArray(links, prepareFileLink)
  // processArray(files, (e) => cluster.queue(e))
  cluster.queue("https://raw.githubusercontent.com/tplagrange/code-scraper/master/app.js")

  await cluster.idle()
  const end = new Date() - start
  const hrend = process.hrtime(hrstart)
  // console.info(`Processed ${links.length} file URLs`)
  console.info('Execution time: %dms', end)
  console.info('Execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000000)
  await cluster.close()
  return process.exit(0)
}

// Any preprocessing, etc...
async function prepareFileLink(link) {
  // TODO: Replacing /blob/ might be a problem if a repo or user is called blob, replacing the last instance would work
  const newLink = link.replace("https://github.com/", "https://raw.githubusercontent.com/").replace("/blob/", "/")
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

function hash(str) {
  var hash = 0
  for (i = 0; i < str.length; i++) {
    chr   = str.charCodeAt(i)
    hash  = ((hash << 5) - hash) + chr
    hash |= 0;
  }
  return hash
}