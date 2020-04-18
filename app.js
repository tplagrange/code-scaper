const cheerio   = require('cheerio');
const fs        = require('fs')
const path      = require('path')
const puppeteer = require('puppeteer');
const request   = require('request');

const bash     = require('./bash.js')
const headless = require('./headless.js')
const url      = require('./url.js')

const { Cluster } = require('puppeteer-cluster')

const seed = "https://github.com/avelino/awesome-go/blob/master/README.md";
const fonts = [ 'monospace', 'initial', 'sans-serif', 'menlo' ];

run(seed)

async function run(seed) {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 20,
    monitor: true,
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
        document.querySelector('pre').style = `font-family: ${font}`;
      }, font);
      await page.screenshot({path: `data/raw/${hash(url)}-${font}.png`, fullPage: true});
    }
  });

  // Measure
  const start = new Date()
  const hrstart = process.hrtime()

  // let hrefs = new Array()
  // hrefs.push("https://github.com/tplagrange/lf")
  // hrefs.push("https://github.com/tplagrange/fireteam-bot")
  const hrefs = await url.getGitHubRepos(seed)
  if (hrefs.length == 0) {
    console.log("[ERROR] No GitHub Repos!")
    await cluster.close()
    return process.exit(1)
  }

  const links = await processArray(hrefs, url.getFileLinks)
  const files = await processArray(links, prepareFileLink)
  processArray(files, (e) => cluster.queue(e))

  await cluster.idle()
  await cluster.close()
  await buildBoxData()
  await buildLTSMData()
  const end = new Date() - start
  const hrend = process.hrtime(hrstart)
  console.info(`Processed ${links.length} file URLs`)
  console.info('Execution time: %dms', end)
  console.info('Execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000000)
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

async function buildBoxData() {
  const rawPath = path.join(__dirname, 'data/raw')
  fs.readdir(rawPath, (err, files) => {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 

    let fileMap = new Map()

    files.forEach((file) => {
        // console.log(file)
        let hashCode
        if (file[0] == "-") {
          hashCode = file.split("-")[1]
          hashCode = "-" + hashCode
        } else {
          hashCode = file.split("-")[0]
        }
        
        if (hashCode.endsWith(".txt")) {
          hashCode = hashCode.split(".")[0]
        }

        if (fileMap.has(hashCode)) {
          return
        } else {
          fileMap.set(hashCode, 1)
          textPath = path.join(rawPath, hashCode + ".txt")
          fonts.forEach((font) => {
            let imagePath = ""
            imagePath = path.join(rawPath, hashCode + "-" + font + ".png")
            if (fs.existsSync(imagePath)) {
              // TODO: Probably need to pass things as env vars in the future
              bash.run(`cd ${path.join(__dirname, 'data/box')} && /usr/local/bin/tesseract`, [ imagePath, `${hashCode}_${font}`, "lstmbox" ])
            }
          });
        }
    });
  });
}

async function buildLTSMData() {
  const rawPath = path.join(__dirname, 'data/raw')
  fs.readdir(rawPath, (err, files) => {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 

    files.forEach((file) => {
      if (!file.endsWith('.png')) {
        return
      } else {
        const fileName = path.basename(file)
        let boxName = fileName.replace(".png", ".box")
        bash.run(`cd ${path.join(__dirname, 'data/lstmf')} && /usr/local/bin/tesseract`, [ path.join(__dirname, `data/box/${boxName}`), path.join(__dirname, `data/raw/${fileName}`), `lstm.train`])
      }
    });
  });
}
