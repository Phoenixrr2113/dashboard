const fs = require('fs')
const path = require('path')
const HTML = require('./html.js')

module.exports = {
  generate,
  outputConfiguration,
  wrapAPIRequest
}

function generate () {
  const routes = {}
  const dashboardModulePath = `${global.applicationPath}/node_modules/@userdashboard/dashboard/src/www`
  const dashboardIsModule = fs.existsSync(dashboardModulePath)
  if (dashboardIsModule) {
    attachRoutes(routes, dashboardModulePath)
  } else {
    attachRoutes(routes, global.rootPath)
  }
  for (const moduleName of global.packageJSON.dashboard.moduleNames) {
    const modulePath = `${global.applicationPath}/node_modules/${moduleName}`
    attachRoutes(routes, `${modulePath}/src/www`)
  }
  if (dashboardIsModule) {
    attachRoutes(routes, global.rootPath)
  }
  return routes
}

function attachRoutes (routes, folderPath) {
  if (!fs.existsSync(folderPath)) {
    return routes
  }
  if (folderPath.endsWith('/src/www/public')) {
    return routes
  }
  const apiOnly = folderPath.indexOf('/api/') > -1
  const folderContents = fs.readdirSync(folderPath)
  for (const file of folderContents) {
    const filePath = `${folderPath}/${file}`
    if (filePath.indexOf('navbar') !== -1 || filePath.endsWith('.test.js')) {
      continue
    }
    if (!filePath.endsWith('.html') && !filePath.endsWith('.js')) {
      const stat = fs.statSync(filePath)
      if (stat.isDirectory()) {
        attachRoutes(routes, filePath)
        continue
      }
      continue
    }
    let htmlFilePath = filePath.substring(0, filePath.lastIndexOf('.')) + '.html'
    if (process.env.DASHBOARD_LANGUAGE) {
      htmlFilePath = htmlFilePath.split('/src/www').join('/language')
    }
    const htmlFileExists = fs.existsSync(htmlFilePath)
    const jsFilePath = filePath.substring(0, filePath.lastIndexOf('.')) + '.js'
    const jsFileExists = fs.existsSync(jsFilePath)
    if (filePath.endsWith('.js') && htmlFileExists) {
      continue
    }
    const api = jsFileExists ? require(jsFilePath) : 'static-page'
    if (api !== 'static-page' && !api.get && !api.post && !api.patch && !api.delete && !api.put) {
      continue
    }
    if (apiOnly) {
      wrapAPIRequest(api, jsFilePath)
    }
    const html = htmlFileExists ? fs.readFileSync(htmlFilePath).toString() : null
    const extension = apiOnly ? '.js' : '.html'
    const index = `index${extension}`
    let folderStem = folderPath.substring(global.rootPath.length)
    if (folderStem.indexOf('src/www') > -1) {
      folderStem = folderStem.substring(folderStem.indexOf('src/www') + 'src/www'.length)
    }
    let urlKey = folderStem + (file === index ? '' : '/' + file.substring(0, file.lastIndexOf('.')))
    if (urlKey === '') {
      urlKey = '/'
    }
    if (routes[urlKey]) {
      if (jsFileExists) {
        routes[urlKey].jsFilePath = jsFilePath.substring(global.applicationPath.length)
        routes[urlKey].api = require(jsFilePath)
      }
      if (htmlFileExists) {
        routes[urlKey].htmlFilePath = htmlFilePath.substring(global.applicationPath.length)
        routes[urlKey].html = fs.readFileSync(htmlFilePath).toString()
      }
      continue
    }
    let template = true
    let auth = api && api.auth === false ? api.auth : true
    let navbar = ''
    if (!apiOnly && html) {
      const settings = readHTMLAttributes(html)
      template = settings.template
      if (settings.auth !== false) {
        auth = true
      } else {
        auth = false
      }
      navbar = settings.navbar
    }
    routes[urlKey] = {
      htmlFileExists,
      htmlFilePathFull: htmlFilePath,
      htmlFilePath: htmlFileExists ? htmlFilePath.substring(global.applicationPath.length) : null,
      html,
      jsFileExists,
      jsFilePathFull: jsFilePath,
      jsFilePath: jsFileExists ? jsFilePath.substring(global.applicationPath.length) : 'static-page',
      template,
      auth,
      navbar,
      api,
      reload: () => {
        if (jsFileExists) {
          delete require.cache[require.resolve(jsFilePath)]
          routes[urlKey].api = require(jsFilePath)
          if (apiOnly) {
            wrapAPIRequest(routes[urlKey].api, jsFilePath)
          }
        }
        if (htmlFileExists) {
          routes[urlKey].html = fs.readFileSync(htmlFilePath).toString()
        }
      }
    }
  }
  return routes
}

function readHTMLAttributes (html) {
  const doc = HTML.parse(html)
  const htmlTag = doc.getElementsByTagName('html')[0]
  let template = true
  let auth = true
  let navbar = ''
  if (htmlTag && htmlTag.attr) {
    template = htmlTag.attr.template !== 'false' && htmlTag.attr.template !== false
    auth = htmlTag.attr.auth !== 'false' && htmlTag.attr.auth !== false
    navbar = htmlTag.attr.navbar || ''
  }
  return { template, auth, navbar }
}

function outputConfiguration () {
  const configuration = parseDashboardConfiguration()
  let widestURL = 0
  let widestHTML = 0
  let widestJS = 0
  let widestAuth = 0
  let widestTemplate = 0
  let widestVerbs = 0
  const sortedURLs = []
  for (const url in configuration.urls) {
    sortedURLs.push(url)
    if (url.length > widestURL) {
      widestURL = url.length
    }
    const route = configuration.urls[url]
    if (route.htmlFilePath && trimNodeModulePath(route.htmlFilePath).length + 4 > widestHTML) {
      widestHTML = trimNodeModulePath(route.htmlFilePath).length + 4
    }
    if (route.jsFilePath && trimNodeModulePath(route.jsFilePath).length + 4 > widestJS) {
      widestJS = trimNodeModulePath(route.jsFilePath).length + 4
    }
  }
  sortedURLs.sort()
  if ('URL  '.length > widestURL) {
    widestURL = 'URL  '.length
  }
  if ('AUTH  '.length > widestAuth) {
    widestAuth = 'AUTH  '.length
  }
  if ('TEMPLATE    '.length > widestTemplate) {
    widestTemplate = 'TEMPLATE  '.length
  }
  if ('HTTP REQUESTS  '.length > widestVerbs) {
    widestVerbs = 'HTTP REQUESTS  '.length
  }
  if ('NODEJS  '.length > widestJS) {
    widestJS = 'NODEJS  '.length
  }
  if ('HTML  '.length > widestHTML) {
    widestHTML = 'HTML  '.length
  }
  let url = global.dashboardServer
  if (global.applicationServer) {
    url += ' (dashboard)\n'
    url += global.applicationServer + ' (application)'
  }
  const output = [
    '@userdashboard/dashboard ' + global.packageJSON.version,
    url
  ]
  output.push('\nAdministrator menu:')
  for (const item of configuration.administrator) {
    output.push(item)
  }
  output.push('\nAccount menu:')
  for (const item of configuration.account) {
    output.push(item)
  }
  output.push('\nSpecial HTML files:',
    trimApplicationPath(configuration.templateHTMLPath),
    trimApplicationPath(configuration.errorHTMLPath),
    trimApplicationPath(configuration.redirectHTMLPath))

  if (configuration.modules.length) {
    output.push('\nDashboard modules:')
    const formatted = []
    for (const item of configuration.modules) {
      formatted.push(`${item.name} (${item.version})`)
    }
    output.push(formatted.join('\n'))
  }
  if (configuration.content.length) {
    output.push('\nContent handlers:')
    for (const item of configuration.content) {
      output.push(item)
    }
  }
  if (configuration.server.length) {
    output.push('\nServer handlers:')
    for (const item of configuration.server) {
      output.push(item)
    }
  }
  for (const url of sortedURLs) {
    const route = configuration.urls[url]
    const routeURL = padRight(url, widestURL)
    const routeHTML = padRight(route.htmlFilePath ? trimNodeModulePath(route.htmlFilePath) : '', widestHTML)
    const routeJS = padRight(trimNodeModulePath(route.jsFilePath), widestJS)
    const routeVerbs = padRight(route.verbs, widestVerbs)
    const routeAuth = padRight(route.authDescription, widestAuth)
    const routeTemplate = padRight(route.templateDescription, widestTemplate)
    output.push(`${routeURL} ${routeAuth} ${routeTemplate} ${routeVerbs} ${routeJS} ${routeHTML}`)
  }
  const routeURL = underlineRight('URL ', widestURL)
  const routeAuth = underlineRight('AUTH ', widestAuth)
  const routeTemplate = underlineRight('TEMPLATE ', widestTemplate)
  const routeVerbs = underlineRight('HTTP REQUESTS ', widestVerbs)
  const routeJS = underlineRight('NODEJS ', widestJS)
  const routeHTML = underlineRight('HTML ', widestHTML)
  output.splice(output.length - sortedURLs.length, 0, `\n${routeURL} ${routeAuth} ${routeTemplate} ${routeVerbs} ${routeJS} ${routeHTML}`)
  const filePath = path.join(global.applicationPath, 'sitemap.txt')
  fs.writeFileSync(filePath, output.join('\n'))
  return output.join('\n')
}

function parseDashboardConfiguration () {
  const configuration = {
    administrator: [],
    account: [],
    modules: [],
    content: [],
    server: [],
    urls: {},
    templateHTMLPath: trimApplicationPath(global.packageJSON.templateHTMLPath),
    errorHTMLPath: trimApplicationPath(global.packageJSON.errorHTMLPath),
    redirectHTMLPath: trimApplicationPath(global.packageJSON.redirectHTMLPath)
  }
  for (const item of global.packageJSON.dashboard.menus.administrator) {
    if (item.module) {
      configuration.administrator.push(item.module + '/src/www' + item.href + ' "' + item.text.replace('&amp;', '&') + '"')
    } else {
      configuration.administrator.push(item.href + ' "' + item.text.replace('&amp;', '&') + '"')
    }
  }
  for (const item of global.packageJSON.dashboard.menus.account) {
    if (item.module) {
      configuration.account.push(item.module + '/src/www' + item.href + ' "' + item.text.replace('&amp;', '&') + '"')
    } else {
      configuration.account.push(item.href + ' "' + item.text.replace('&amp;', '&') + '"')
    }
  }
  if (global.packageJSON.dashboard.moduleNames.length) {
    for (const i in global.packageJSON.dashboard.moduleNames) {
      const name = global.packageJSON.dashboard.moduleNames[i]
      const version = global.packageJSON.dashboard.moduleVersions[i]
      configuration.modules.push({ name, version })
    }
  }
  if (global.packageJSON.dashboard.contentFilePaths.length) {
    for (const item of global.packageJSON.dashboard.contentFilePaths) {
      configuration.content.push(item[0] === '@' ? item : trimApplicationPath(item))
    }
  }
  if (global.packageJSON.dashboard.serverFilePaths.length) {
    for (const item of global.packageJSON.dashboard.serverFilePaths) {
      configuration.server.push(item[0] === '@' ? item : trimApplicationPath(item))
    }
  }
  const httpVerbs = ['DELETE', 'HEAD', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT']
  for (const url in global.sitemap) {
    const route = global.sitemap[url]
    const item = configuration.urls[url] = {}
    item.htmlFilePath = route.htmlFilePath
    item.jsFilePath = route.jsFilePath
    item.templateDescription = route.template === false ? 'FULLSCREEN' : ''
    item.verbs = ''
    if (url.startsWith('/api/')) {
      item.authDescription = route.api.auth === false ? 'GUEST' : ''
      const verbs = []
      for (const verb of httpVerbs) {
        if (route.api[verb.toLowerCase()]) {
          verbs.push(verb)
        }
      }
      item.verbs = verbs.join(' ')
    } else {
      item.authDescription = route.auth === false ? 'GUEST' : ''
      const verbs = []
      if (route.jsFilePath === 'static-page') {
        verbs.push('GET')
      } else {
        const pageFile = route.api
        for (const verb of httpVerbs) {
          if (pageFile[verb.toLowerCase()]) {
            verbs.push(verb)
          }
        }
      }
      item.verbs = verbs.join(' ')
    }
  }
  return configuration
}

function trimApplicationPath (str) {
  if (!str) {
    return 'static-page'
  }
  if (str.startsWith('/src/www/')) {
    return '/src/www'
  }
  if (!str.startsWith(global.applicationPath)) {
    return str
  }
  const trimmed = str.substring(global.applicationPath.length)
  if (trimmed.startsWith('/node_modules/')) {
    return trimNodeModulePath(trimmed)
  }
  return trimmed
}

function trimNodeModulePath (str) {
  if (!str) {
    return 'static-page'
  }
  if (str.indexOf('/src/www/') === 0) {
    return '/src/www'
  }
  return str.substring('/node_modules/'.length).split('/src/www')[0]
}

function padRight (str, totalSize) {
  const blank = '                                                                                                                                                                                                                                                        '
  return (str + blank).substring(0, totalSize)
}

function underlineRight (str, totalSize) {
  const blank = '--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------'
  return (str + blank).substring(0, totalSize)
}

function wrapAPIRequest (nodejsHandler, filePath) {
  for (const functionName of ['get', 'post', 'patch', 'delete', 'put', 'head', 'option']) {
    const originalFunction = nodejsHandler[functionName]
    if (!originalFunction) {
      continue
    }
    if (nodejsHandler[`_${functionName}`]) {
      continue
    }
    nodejsHandler[`_${functionName}`] = originalFunction
    nodejsHandler[functionName] = wrapResponseHandling(nodejsHandler[`_${functionName}`], filePath)
  }
  return nodejsHandler
}

function wrapResponseHandling (method, filePath) {
  return async (req, res) => {
    if (process.env.NODE_ENV === 'testing' &&
        req.urlPath !== filePath &&
        !res) {
      const urlPath = filePath
      if (global.apiDependencies.indexOf(urlPath) === -1) {
        global.apiDependencies.push(urlPath)
      }
    }
    let result
    try {
      result = await method(req)
    } catch (error) {
      if (res) {
        res.statusCode = 500
        res.setHeader('content-type', 'application/json; charset=utf-8')
        return res.end(`{ "object": "error", "message": "${error.message || 'An error ocurred'}" }`)
      }
      throw error
    }
    if (res) {
      res.statusCode = 200
      res.setHeader('content-type', 'application/json; charset=utf-8')
      return res.end(result ? JSON.stringify(result) : '')
    }
    return result
  }
}
