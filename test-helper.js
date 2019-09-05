/* eslint-env mocha */
global.applicationPath = global.applicationPath || __dirname
global.appid = global.appid || `tests`
const bcrypt = require('./src/bcrypt.js')
const dashboard = require('./index.js')
const fs = require('fs')
const http = require('http')
const https = require('https')
const puppeteer = require('puppeteer')
const querystring = require('querystring')
const testData = require('./test-data.json')
const TestHelperPuppeteer = require('./test-helper-puppeteer.js')
const url = require('url')
const util = require('util')

const storagePath = process.env.STORAGE_PATH || `${__dirname}/data`
let testDataIndex = 0

if (process.env.STORAGE_ENGINE) {
  require(`${process.env.STORAGE_ENGINE}/test-helper.js`)
}

if (process.env.STORAGE_CACHE) {
  require(`${process.env.STORAGE_CACHE}/test-helper.js`)
}

let packageJSON
before(async () => {
  await dashboard.start(global.applicationPath || __dirname)
  packageJSON = global.packageJSON
})

beforeEach(async () => {
  global.packageJSON = packageJSON
  global.appid = `tests_${dashboard.Timestamp.now}`
  global.allowPublicAPI = true
  global.testNumber = dashboard.Timestamp.now
  global.testModuleJSON = null
  global.requireProfile = true
  global.userProfileFields = ['full-name', 'contact-email']
  global.minimumUsernameLength = 1
  global.maximumUsernameLength = 100
  global.minimumPasswordLength = 1
  global.maximumPasswordLength = 100
  global.minimumResetCodeLength = 1
  global.maximumResetCodeLength = 100
  global.requireProfile = false
  global.minimumFirstNameLength = 1
  global.maximumFirstNameLength = 100
  global.minimumLastNameLength = 1
  global.maximumLastNameLength = 100
  global.minimumDisplayNameLength = 1
  global.maximumDisplayNameLength = 100
  global.deleteDelay = 7
  global.maximumFieldLength = 50
  global.pageSize = 2
  global.allowPublicAPI = true
  global.bcryptFixedSalt = bcrypt.genSaltSync(4)
  if (!process.env.STORAGE_ENGINE) {
    if (fs.existsSync(storagePath)) {
      deleteLocalData(storagePath)
    }
    fs.mkdirSync(storagePath)
    await wait()
  }
})

afterEach(() => {
  if (!process.env.STORAGE_ENGINE) {
    if (fs.existsSync(storagePath)) {
      deleteLocalData(storagePath)
    }
  }
})

after((callback) => {
  dashboard.stop()
  global.testEnded = true
  return callback()
})

const wait = util.promisify(function (amount, callback) {
  if (amount && !callback) {
    callback = amount
    amount = null
  }
  if (!process.env.STORAGE_ENGINE) {
    return setTimeout(callback, amount || 1)
  }
  return callback()
})

module.exports = {
  createAdministrator,
  createOwner,
  createProfile,
  createRequest,
  createSession,
  createResetCode,
  deleteResetCode,
  createUser,
  nextIdentity,
  setDeleted,
  extractDoc,
  extractRedirectURL,
  wait
}

function createRequest (rawURL) {
  const req = {
    appid: global.appid,
    url: rawURL,
    urlPath: rawURL.split('?')[0]
  }
  if (req.url !== req.urlPath) {
    req.query = url.parse(rawURL, true).query
  }
  req.route = global.sitemap[req.urlPath]
  if (global.applicationServer && !req.route) {
    req.route = {}
  }
  for (const verb of ['get', 'post', 'patch', 'delete', 'put']) {
    req[verb] = async () => {
      req.method = verb.toUpperCase()
      if (req.url.startsWith('/api/')) {
        let result
        try {
          result = await proxy(verb, rawURL, req)
        } catch (error) {
          return error
        }
        return result
      }
      // open in puppeteer and return HTML
      let result
      try {
        result = await fetchWithPuppeteer(req.method, req)
      } catch (error) {
        return error
      }
      return result
    }
  }
  return req
}

function extractDoc (str) {
  if (!str) {
    return null
  }
  let doc
  const templateDoc = str.node ? str : dashboard.HTML.parse(str)
  const applicationIframe = templateDoc.getElementById('application-iframe')
  if (applicationIframe) {
    const pageSource = applicationIframe.attr.srcdoc.join(' ')
    doc = dashboard.HTML.parse(pageSource)
  } else {
    doc = templateDoc
  }
  return doc
}

function extractRedirectURL (doc) {
  const metaTags = doc.getElementsByTagName('meta')
  if (metaTags && metaTags.length) {
    for (const metaTag of metaTags) {
      if (!metaTag.attr || !metaTag.attr.content || metaTag.attr['http-equiv'] !== 'refresh') {
        continue
      }
      return metaTag.attr.content.split(';url=')[1]
    }
  }
  return null
}

function nextIdentity () {
  testDataIndex++
  if (testDataIndex >= testData.length) {
    testDataIndex = 0
  }
  return testData[testDataIndex]
}

async function createAdministrator (owner) {
  const administrator = await createUser('administrator-' + dashboard.Timestamp.now + '-' + Math.ceil(Math.random() * 100000))
  if (!administrator.account.administrator) {
    if (!owner) {
      throw new Error('created a user with no owner to elevate permissions')
    }
    const credentials = administrator.account
    const req2 = createRequest(`/api/administrator/set-account-administrator?accountid=${administrator.account.accountid}`)
    req2.account = owner.account
    req2.session = owner.session
    administrator.account = await req2.patch(req2)
    administrator.account.username = credentials.username
    administrator.account.password = credentials.password
  }
  return administrator
}

async function createOwner () {
  const owner = await createUser('owner-' + dashboard.Timestamp.now + '-' + Math.ceil(Math.random() * 100000))
  // only the first account created is the owner and only
  // the owner can transfer to a different account so the
  // API cannot assign the permission needed and the
  // storage must be written to directly
  if (!owner.account.administrator) {
    await dashboard.StorageObject.setProperty(`${global.appid}/account/${owner.account.accountid}`, `administrator`, dashboard.Timestamp.now)
    await dashboard.StorageList.add(`${global.appid}/administrator/accounts`, owner.account.accountid)
    owner.account.administrator = dashboard.Timestamp.now
  }
  if (!owner.account.owner) {
    await dashboard.StorageObject.setProperty(`${global.appid}/account/${owner.account.accountid}`, `owner`, dashboard.Timestamp.now)
    owner.account.owner = dashboard.Timestamp.now
  }
  return owner
}

async function createUser (username) {
  if (testDataIndex >= testData.length) {
    testDataIndex = 0
  }
  username = username || 'user-' + dashboard.Timestamp.now + '-' + Math.ceil(Math.random() * 100000)
  const password = username
  const req = createRequest('/api/user/create-account')
  const profileFieldsWere = global.userProfileFields
  global.requireProfile = true
  global.userProfileFields = ['full-name', 'contact-email']
  req.body = {
    username,
    password,
    'first-name': testData[testDataIndex].firstName,
    'last-name': testData[testDataIndex].lastName,
    'contact-email': testData[testDataIndex].email
  }
  testDataIndex++
  let account = await req.post()
  account.username = username
  account.password = password
  const req2 = createRequest(`/api/user/create-session?accountid=${account.accountid}`)
  req2.body = {
    username,
    password
  }
  let session = await req2.post()
  const req4 = createRequest(`/api/user/account?accountid=${account.accountid}`)
  req4.account = account
  req4.session = session
  account = await req4.get()
  const req3 = createRequest(`/api/user/profile?profileid=${account.profileid}`)
  req3.account = account
  req3.session = session
  const profile = await req3.get()
  const req5 = createRequest(`/api/user/session?sessionid=${session.sessionid}`)
  req5.account = account
  req5.session = session
  const token = session.token
  session = await req5.get()
  const user = { profile, account, session }
  user.session.token = token
  user.account.username = username
  user.account.password = password
  global.userProfileFields = profileFieldsWere
  return user
}

async function createSession (user, remember) {
  const req = createRequest(`/api/user/create-session?accountid=${user.account.accountid}`)
  req.body = {
    username: user.account.username,
    password: user.account.password,
    remember: remember || ''
  }
  user.session = await req.post()
  await wait(100)
  return user.session
}

async function setDeleted (user) {
  const req = createRequest(`/api/user/set-account-deleted?accountid=${user.account.accountid}`)
  req.account = user.account
  req.session = user.session
  req.body = {
    password: user.account.password
  }
  user.account = await req.patch()
  user.account.username = req.account.username
  user.account.password = req.account.password
  return user.account
}

async function createResetCode (user) {
  const code = 'resetCode-' + dashboard.Timestamp.now + '-' + Math.ceil(Math.random() * 100000)
  const req = createRequest(`/api/user/create-reset-code?accountid=${user.account.accountid}`)
  req.account = user.account
  req.session = user.session
  req.body = { code }
  user.resetCode = await req.post()
  user.resetCode.code = code
  await wait(100)
  return user.resetCode
}

async function deleteResetCode (user) {
  const req = createRequest(`/api/user/delete-reset-code?codeid=${user.resetCode.codeid}`)
  req.account = user.account
  req.session = user.session
  await req.delete()
}

async function createProfile (user, properties) {
  testDataIndex++
  if (testDataIndex >= testData.length) {
    testDataIndex = 0
  }
  const req = createRequest(`/api/user/create-profile?accountid=${user.account.accountid}`)
  req.account = user.account
  req.session = user.session
  req.body = properties
  testDataIndex++
  user.profile = await req.post()
  await wait(100)
  return user.profile
}

const proxy = util.promisify((method, path, req, callback) => {
  const baseURLParts = process.env.DASHBOARD_SERVER.split('://')
  let host, port
  const colon = baseURLParts[1].indexOf(':')
  if (colon > -1) {
    port = baseURLParts[1].substring(colon + 1)
    host = baseURLParts[1].substring(0, colon)
  } else if (baseURLParts[0] === 'https') {
    port = 443
    host = baseURLParts[1]
  } else if (baseURLParts[0] === 'http') {
    port = 80
    host = baseURLParts[1]
  }
  const requestOptions = {
    host,
    path,
    port,
    method: method.toUpperCase(),
    headers: {
      'user-agent': 'integration tests'
    }
  }
  let postData
  if (req.body) {
    // multipart payloads where req.body is a buffer
    if (req.body.write) {
      postData = req.body
      requestOptions.headers = req.headers
      requestOptions.headers['user-agent'] = 'integration tests'
    } else {
      // req.body = { key: value }
      postData = querystring.stringify(req.body)
      requestOptions.headers['content-length'] = postData.length
    }
  }
  if (req.session && req.session.expires) {
    const expires = dashboard.Timestamp.date(req.session.expires)
    requestOptions.headers.cookie = `sessionid=${req.session.sessionid}; token=${req.session.token}; expires=${expires.toUTCString()}; path=/`
  }
  const protocol = baseURLParts[0] === 'https' ? https : http
  const proxyRequest = protocol.request(requestOptions, (proxyResponse) => {
    let body = ''
    proxyResponse.on('data', (chunk) => {
      body += chunk
    })
    return proxyResponse.on('end', () => {
      if (!body) {
        return callback()
      }
      if (proxyResponse.headers['set-cookie']) {
        const cookie = proxyResponse.headers['set-cookie']
        const sessionid = cookie[0].substring(cookie[0].indexOf('=') + 1)
        const expires = cookie[0].substring(cookie[0].indexOf('expires=') + 'expires='.length)
        const token = cookie[1].substring(cookie[1].indexOf('=') + 1)
        req.session = {
          sessionid: sessionid.split(';')[0],
          token: token.split(';')[0],
          expires: dashboard.Timestamp.create(dashboard.Format.parseDate(expires))
        }
      }
      if (proxyResponse.headers['content-type']) {
        if (proxyResponse.headers['content-type'].startsWith('text/html')) {
          const doc = dashboard.HTML.parse(body.toString())
          return callback(null, doc)
        }
        if (proxyResponse.headers['content-type'].startsWith('application/json')) {
          body = JSON.parse(body.toString())
          return callback(null, body)
        }
      }
      return callback(null, body)
    })
  })
  proxyRequest.on('error', (error) => {
    return callback(error)
  })
  if (postData) {
    proxyRequest.write(postData)
  }
  return proxyRequest.end()
})

function deleteLocalData (currentPath) {
  if (!fs.existsSync(currentPath)) {
    return
  }
  const contents = fs.readdirSync(currentPath)
  for (const item of contents) {
    var itemPath = `${currentPath}/${item}`
    const stat = fs.lstatSync(itemPath)
    if (stat.isDirectory()) {
      deleteLocalData(itemPath)
    } else {
      fs.unlinkSync(itemPath)
    }
  }
  fs.rmdirSync(currentPath)
}

async function fetchWithPuppeteer (method, req) {
  const browser = await puppeteer.launch({
    headless: !(process.env.SHOW_BROWSERS === 'true'),
    args: ['--window-size=1920,1080', '--incognito'],
    slowMo: 20
  })
  const pages = await browser.pages()
  const page = pages[0]
  page.on('error', (error) => {
  })
  await page.emulate({
    name: 'Desktop',
    userAgent: 'Desktop browser',
    viewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      isLandscape: false
    }
  })
  await page.goto(`${process.env.DASHBOARD_SERVER}/account/signin`, { waitLoad: true, waitNetworkIdle: true })
  await TestHelperPuppeteer.fill(page, {
    username: req.account.username,
    password: req.account.password
  })
  await TestHelperPuppeteer.click(page, 'Sign in')
  await page.goto(`${process.env.DASHBOARD_SERVER}${req.url}`, { waitLoad: true, waitNetworkIdle: true })
  if (method === 'POST') {
    await TestHelperPuppeteer.fill(page, req.body)
    await TestHelperPuppeteer.click(page, '#submit-button')
  }
  const htmls = await page.$$('html')
  const html = await page.evaluate(el => el.outerHTML, htmls[0])
  await page.close()
  await browser.close()
  return html
}
