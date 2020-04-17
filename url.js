const cheerio = require('cheerio');
const request = require('request');

const gitHubRepoRegex = /^https:\/\/github\.com\/(?!about\/|contact\/|features\/|nonprofit\/|pricing\/|site\/)[^\/]+\/\S[^\/]+$/;
const goFileRegex = /^(https:\/\/github\.com\/\S[^\/]+\/\S[^\/]+\/\S[^\.]+\.go)$/;

const getAllLinks = async (url) => {
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

// For now I will get a dataset containing only .go files
const getFileLinks = async (url) => {
  nurl = url + "/search?l=go"
  const hrefs = await getAllLinks(nurl)
  const fixed = hrefs.filter( e => e.startsWith('/')).map( i => 'https://github.com' + i)
  const files = fixed.flatMap(e => goFileRegex.exec(e)).filter( i => i != null)
  const deduped = [...new Set(files)]

  return deduped
}

const getGitHubRepos = async (url) => {
  const hrefs = await getAllLinks(url)
  const repos = hrefs.flatMap( e => gitHubRepoRegex.exec(e)).filter( e => e != null)
  const dedupedRepos = [...new Set(repos)]

  return dedupedRepos
}

module.exports = {
  getAllLinks,getFileLinks,getGitHubRepos
}