/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../test-helper.js')

describe('/account/create-reset-code', () => {
  describe('CreateResetCode#GET', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/create-reset-code')
      req.account = user.account
      req.session = user.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('CreateResetCode#POST', () => {
    it('should reject missing secret-code', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/create-reset-code')
      req.account = user.account
      req.session = user.session
      req.body = {
        'secret-code': '',
        post: 'at least one field'
      }
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const message = doc.getElementById('message-container').child[0]
      assert.strictEqual(message.attr.template, 'invalid-secret-code')
    })

    it('should reject short secret-code', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/create-reset-code')
      req.account = user.account
      req.session = user.session
      req.body = {
        'secret-code': '1'
      }
      global.minimumResetCodeLength = 100
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const message = doc.getElementById('message-container').child[0]
      assert.strictEqual(message.attr.template, 'invalid-secret-code-length')
    })

    it('should reject long secret-code', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/create-reset-code')
      req.account = user.account
      req.session = user.session
      req.body = {
        'secret-code': '1000000'
      }
      global.maximumResetCodeLength = 1
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const message = doc.getElementById('message-container').child[0]
      assert.strictEqual(message.attr.template, 'invalid-secret-code-length')
    })

    it('should create reset code (screenshots)', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/create-reset-code')
      req.account = user.account
      req.session = user.session
      req.body = {
        'secret-code': '123456890'
      }
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account' },
        { click: '/account/reset-codes' },
        { click: '/account/create-reset-code' },
        { fill: '#submit-form' }
      ]
      global.minimumResetCodeLength = 1
      const page = await req.post()
      const doc = TestHelper.extractDoc(page)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })
})
