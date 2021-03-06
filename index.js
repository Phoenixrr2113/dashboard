const API = require('./src/api.js')
const fs = require('fs')
const mergePackageJSON = require('./src/merge-package-json.js')
const Server = require('./src/server.js')
const Sitemap = require('./src/sitemap.js')
const Timestamp = require('./src/timestamp.js')

let defaultFixedSalt, defaultSessionKey
if (process.env.NODE_ENV !== 'production') {
  defaultFixedSalt = '$2a$10$uyrNLHlx/gxwbdSowtRP7u'
  defaultSessionKey = 'dashboard-session-key'
}

global.host = process.env.IP || 'localhost'
global.port = parseInt(process.env.PORT || '8000', 10)
global.applicationServer = process.env.APPLICATION_SERVER
global.applicationServerToken = process.env.APPLICATION_SERVER_TOKEN
if (global.applicationServer && !global.applicationServerToken) {
  throw new Error('Invalid APPLICATION_SERVER_TOKEN')
}
global.dashboardSessionKey = process.env.DASHBOARD_SESSION_KEY || defaultSessionKey
global.bcryptFixedSalt = process.env.BCRYPT_FIXED_SALT || defaultFixedSalt
if (!global.bcryptFixedSalt) {
  throw new Error('Invalid BCRYPT_FIXED_SALT')
}
if (!global.dashboardSessionKey) {
  throw new Error('Invalid DASHBOARD_SESSION_KEY')
}
if (process.env.ENCRYPTION_SECRET &&
  process.env.ENCRYPTION_SECRET.length !== 32) {
  throw new Error('Invalid ENCRYPTION_SECRET length (32)')
}
if (process.env.ENCRYPTION_SECRET &&
   (!process.env.ENCRYPTION_SECRET_IV ||
  process.env.ENCRYPTION_SECRET_IV.length !== 16)) {
  throw new Error('Invalid ENCRYPTION_SECRET_IV length (16)')
}
global.requireProfile = process.env.REQUIRE_PROFILE === 'true'
global.profileFields = ['display-name', 'display-email', 'contact-email', 'full-name', 'dob', 'phone', 'occupation', 'location', 'company-name', 'website']
global.profileFieldMap = {}
for (const field of global.profileFields) {
  if (field === 'full-name') {
    global.profileFieldMap['first-name'] = 'firstName'
    global.profileFieldMap['last-name'] = 'lastName'
    continue
  }
  let displayName = field
  if (displayName.indexOf('-') > -1) {
    displayName = displayName.split('-')
    if (displayName.length === 1) {
      displayName = displayName[0]
    } else if (displayName.length === 2) {
      displayName = displayName[0] + displayName[1].substring(0, 1).toUpperCase() + displayName[1].substring(1)
    } else if (displayName.length === 3) {
      displayName = displayName[0] + displayName[1].substring(0, 1).toUpperCase() + displayName[1].substring(1) + displayName[2].substring(0, 1).toUpperCase() + displayName[2].substring(1)
    }
  }
  global.profileFieldMap[field] = displayName
}

if (!process.env.USER_PROFILE_FIELDS) {
  global.userProfileFields = [
    'contact-email',
    'full-name'
  ]
} else {
  global.userProfileFields = process.env.USER_PROFILE_FIELDS.split(',')
}
global.appid = process.env.APPID || process.env.DOMAIN || 'dashboard'
global.allowPublicAPI = process.env.ALLOW_PUBLIC_API === 'true'
global.dashboardServer = process.env.DASHBOARD_SERVER
global.domain = process.env.DOMAIN || ''
global.idLength = parseInt(process.env.ID_LENGTH || '8', 10)
global.language = process.env.LANGUAGE || 'en-us'
global.minimumUsernameLength = parseInt(process.env.MINIMUM_USERNAME_LENGTH || '1', 6)
global.maximumUsernameLength = parseInt(process.env.MAXIMUM_USERNAME_LENGTH || '50', 10)
global.minimumPasswordLength = parseInt(process.env.MINIMUM_PASSWORD_LENGTH || '1', 6)
global.maximumPasswordLength = parseInt(process.env.MAXIMUM_PASSWORD_LENGTH || '50', 10)
global.minimumResetCodeLength = parseInt(process.env.MINIMUM_RESET_CODE_LENGTH || '10', 6)
global.maximumResetCodeLength = parseInt(process.env.MAXIMUM_RESET_CODE_LENGTH || '50', 10)
global.minimumProfileFirstNameLength = parseInt(process.env.MINIMUM_PROFILE_FIRST_NAME_LENGTH || '1', 10)
global.maximumProfileFirstNameLength = parseInt(process.env.MAXIMUM_PROFILE_FIRST_NAME_LENGTH || '50', 10)
global.minimumProfileLastNameLength = parseInt(process.env.MINIMUM_PROFILE_LAST_NAME_LENGTH || '1', 10)
global.maximumProfileLastNameLength = parseInt(process.env.MAXIMUM_PROFILE_LAST_NAME_LENGTH || '50', 10)
global.minimumProfileDisplayNameLength = parseInt(process.env.MINIMUM_PROFILE_DISPLAY_NAME_LENGTH || '1', 1)
global.maximumProfileDisplayNameLength = parseInt(process.env.MAXIMUM_PROFILE_DISPLAY_NAME_LENGTH || '50', 10)
global.minimumProfileCompanyNameLength = parseInt(process.env.MINIMUM_PROFILE_COMPANY_NAME_LENGTH || '1', 1)
global.maximumProfileCompanyNameLength = parseInt(process.env.MAXIMUM_PROFILE_COMPANY_NAME_LENGTH || '50', 10)
global.deleteDelay = parseInt(process.env.DELETE_DELAY || '7', 10)
global.pageSize = parseInt(process.env.PAGE_SIZE || '10', 10)

module.exports = {
  Format: require('./src/format.js'),
  Hash: require('./src/hash.js'),
  HTML: require('./src/html.js'),
  Response: require('./src/response.js'),
  Timestamp: require('./src/timestamp.js'),
  UUID: require('./src/uuid.js'),
  start: (applicationPath) => {
    module.exports.setup(applicationPath)
    module.exports.Storage = require('./src/storage.js')
    module.exports.StorageList = require('./src/storage-list.js')
    module.exports.StorageObject = require('./src/storage-object.js')
    return Server.start()
  },
  stop: () => {
    clearInterval(Timestamp.interval)
    delete (Timestamp.interval)
    return Server.stop()
  },
  setup: (applicationPath) => {
    global.applicationPath = applicationPath
    global.rootPath = `${applicationPath}/src/www`
    global.packageJSON = mergePackageJSON()
    global.sitemap = Sitemap.generate()
    global.api = API.createFromSitemap()
    if (process.env.GENERATE_SITEMAP_TXT !== 'false') {
      Sitemap.outputConfiguration()
    }
    if (process.env.GENERATE_API_TXT !== 'false') {
      API.outputConfiguration()
    }
    if (global.applicationServer) {
      const rootIndexPageExists = fs.existsSync(`${global.applicationPath}/src/www/index.html`)
      const rootHomePageExists = fs.existsSync(`${global.applicationPath}/src/www/home.html`)
      if (!rootIndexPageExists) {
        delete (global.sitemap['/'])
      }
      if (!rootHomePageExists) {
        delete (global.sitemap['/home'])
      }
    }
    if (process.env.NODE_ENV === 'sitemap') {
      return process.exit(0)
    }
  }
}
