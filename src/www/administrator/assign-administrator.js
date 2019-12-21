const dashboard = require('../../../index.js')
const navbar = require('./navbar-account.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.accountid) {
    throw new Error('invalid-accountid')
  }
  const account = await global.api.administrator.Account.get(req)
  if (!account || account.deleted) {
    throw new Error('invalid-account')
  }
  account.createdFormatted = dashboard.Format.date(account.created)
  account.lastSignedInFormatted = dashboard.Format.date(account.lastSignedIn)
  req.data = { account }
}

async function renderPage (req, res, messageTemplate) {
  if (req.success) {
    if (req.query && req.query['return-url']) {
      return dashboard.Response.redirect(req, res, decodeURI(req.query['return-url']))
    }
    messageTemplate = 'success'
  } else if (req.error) {
    messageTemplate = req.error
  }
  const doc = dashboard.HTML.parse(req.route.html, req.data.account, 'account')
  await navbar.setup(doc, req.data.account)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success') {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      const accountsTable = doc.getElementById('accounts-table')
      accountsTable.parentNode.removeChild(accountsTable)
    }
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  try {
    await global.api.administrator.SetAccountAdministrator.patch(req)
    if (req.success) {
      return renderPage(req, res, 'success')
    }
    return renderPage(req, res, 'unknown-error')
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
