/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../test-helper.js')

describe('/administrator/account', () => {
  describe('Account#BEFORE', () => {
    it('should bind account to req', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/administrator/account?accountid=${user.account.accountid}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.account.accountid, user.account.accountid)
    })

    it('should bind profiles to req', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/administrator/account?accountid=${user.account.accountid}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.profiles[0].accountid, user.profile.accountid)
    })

    it('should bind sessions to req', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/administrator/account?accountid=${user.account.accountid}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.sessions.length, 1)
      assert.strictEqual(req.data.sessions[0].sessionid, user.session.sessionid)
    })

    it('should bind reset codes to req', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      await TestHelper.createResetCode(user)
      const req = TestHelper.createRequest(`/administrator/account?accountid=${user.account.accountid}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.resetCodes.length, 1)
      assert.strictEqual(req.data.resetCodes[0].accountid, user.account.accountid)
    })
  })

  describe('Account#GET', () => {
    it('should present the account table (screenshots)', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/administrator/account?accountid=${user.account.accountid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#administrator-menu-container' },
        { click: '/administrator' },
        { click: '/administrator/accounts' },
        { click: `/administrator/account?accountid=${user.account.accountid}` }
      ]
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const tbody = doc.getElementById(user.account.accountid)
      assert.strictEqual(tbody.tag, 'tbody')
    })

    it('should present the profile table', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/administrator/account?accountid=${user.account.accountid}`)
      req.account = administrator.account
      req.session = administrator.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const row = doc.getElementById(user.account.profileid)
      assert.strictEqual(row.tag, 'tr')
    })

    it('should present the sessions table', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/administrator/account?accountid=${user.account.accountid}`)
      req.account = administrator.account
      req.session = administrator.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const row = doc.getElementById(user.session.sessionid)
      assert.strictEqual(row.tag, 'tr')
    })

    it('should hide empty reset codes table', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/administrator/account?accountid=${user.account.accountid}`)
      req.account = administrator.account
      req.session = administrator.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const table = doc.getElementById('reset-codes-table')
      assert.strictEqual(undefined, table)
    })

    it('should present a populated reset codes table', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      await TestHelper.createResetCode(user)
      const req = TestHelper.createRequest(`/administrator/account?accountid=${user.account.accountid}`)
      req.account = administrator.account
      req.session = administrator.session
      const page = await req.get()
      const doc = TestHelper.extractDoc(page)
      const row = doc.getElementById(user.resetCode.codeid)
      assert.strictEqual(row.tag, 'tr')
    })
  })
})
