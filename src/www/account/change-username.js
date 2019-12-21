const dashboard = require('../../../index.js')

module.exports = {
  get: renderPage,
  post: submitForm
}

function renderPage (req, res, messageTemplate) {
  if (req.success) {
    if (req.query && req.query['return-url']) {
      return dashboard.Response.redirect(req, res, decodeURI(req.query['return-url']))
    }
    messageTemplate = 'success'
  } else if (req.error) {
    messageTemplate = req.error
  }
  const doc = dashboard.HTML.parse(req.route.html)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req.body) {
    return renderPage(req, res)
  }
  req.body['new-username'] = req.body['new-username'].trim ? req.body['new-username'].trim() : req.body['new-username']
  if (!req.body['new-username'] || !req.body['new-username'].length) {
    return renderPage(req, res, 'invalid-new-username')
  }
  if (global.minimumUsernameLength > req.body['new-username'].length ||
    global.maximumUsernameLength < req.body['new-username'].length) {
    return renderPage(req, res, 'invalid-new-username-length')
  }
  if (!req.body.password || !req.body.password.length) {
    return renderPage(req, res, 'invalid-password')
  }
  try {
    req.query = req.query || {}
    req.query.accountid = req.account.accountid
    await global.api.user.SetAccountUsername.patch(req)
    if (req.success) {
      return renderPage(req, res, 'success')
    }
    return renderPage(req, res, 'unknown-error')
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
