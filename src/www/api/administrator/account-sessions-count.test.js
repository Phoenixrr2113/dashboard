/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')

describe('/api/administrator/account-sessions-count', () => {
  describe('exceptions', () => {
    describe('invalid-accountid', () => {
      it('missing querystring accountid', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/account-profiles-count')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-accountid')
      })

      it('invalid querystring accountid', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/account-profiles-count?accountid=invalid')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-accountid')
      })
    })
  })

  describe('returns', () => {
    it('integer', async () => {
      const administrator = await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createSession(user)
      }
      const req = TestHelper.createRequest(`/api/administrator/account-sessions-count?accountid=${user.account.accountid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.saveResponse = true
      const result = await req.get()
      assert.strictEqual(result, global.pageSize + 2)
    })
  })
})
