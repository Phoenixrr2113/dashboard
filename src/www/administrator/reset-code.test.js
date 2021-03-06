/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../test-helper.js')

describe('/administrator/reset-code', () => {
  describe('ResetCode#BEFORE', () => {
    it('should bind reset code to req', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      await TestHelper.createResetCode(user)
      const req = TestHelper.createRequest(`/administrator/reset-code?codeid=${user.resetCode.codeid}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.resetCode.codeid, user.resetCode.codeid)
    })
  })

  describe('ResetCode#GET', () => {
    it('should present the reset code table (screenshots)', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      await TestHelper.createResetCode(user)
      const req = TestHelper.createRequest(`/administrator/reset-code?codeid=${user.resetCode.codeid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#administrator-menu-container' },
        { click: '/administrator' },
        { click: '/administrator/reset-codes' },
        { click: `/administrator/reset-code?codeid=${user.resetCode.codeid}` }
      ]
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const table = doc.getElementById('reset-codes-table')
      const tbody = table.getElementById(user.resetCode.codeid)
      assert.strictEqual(tbody.tag, 'tbody')
    })
  })
})
