/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')

describe(`/api/user/create-profile`, () => {
  describe('CreateProfile#POST', () => {
    it('should require full name', async () => {
      global.userProfileFields = [ 'full-name' ]
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/create-profile?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        'first-name': null,
        'last-name': 'Test'
      }
      let errorMessage
      try {
        await req.route.api.post(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-first-name')
      req.body = {
        'first-name': 'Test',
        'last-name': null
      }
      try {
        await req.route.api.post(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-last-name')
    })

    it('should enforce name field lengths', async () => {
      global.userProfileFields = ['full-name']
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/create-profile?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        'first-name': '1',
        'last-name': 'Test'
      }
      global.minimumProfileFirstNameLength = 10
      global.maximumProfileFirstNameLength = 100
      let errorMessage
      try {
        await req.route.api.post(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-first-name-length')
      global.minimumProfileFirstNameLength = 1
      global.maximumProfileFirstNameLength = 1
      req.body = {
        'first-name': '123456789',
        'last-name': 'Test',
        'contact-email': 'test@email.com'
      }
      errorMessage = null
      try {
        await req.route.api.post(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-first-name-length')
    })

    it('should create new profile with full name', async () => {
      global.userProfileFields = ['full-name']
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/create-profile?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        'first-name': 'Test',
        'last-name': 'Person'
      }
      const profile = await req.post()
      assert.strictEqual(profile.firstName, req.body['first-name'])
      assert.strictEqual(profile.lastName, req.body['last-name'])
    })

    it('should reject missing contact email', async () => {
      global.userProfileFields = ['contact-email']
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/create-profile?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        'contact-email': ' '
      }
      let errorMessage
      try {
        await req.route.api.post(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-contact-email')
    })

    it('should require "@" in contact email', async () => {
      global.userProfileFields = ['contact-email']
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/create-profile?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        'contact-email': 'invalid'
      }
      let errorMessage
      try {
        await req.route.api.post(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-contact-email')
    })

    it('should create new profile with contact email', async () => {
      global.userProfileFields = ['contact-email']
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/create-profile?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        'contact-email': user.profile.contactEmail
      }
      const profile = await req.post()
      assert.strictEqual(profile.contactEmail, req.body['contact-email'])
    })

    it('should reject missing display email', async () => {
      global.userProfileFields = ['display-email']
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/create-profile?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        'display-email': ' '
      }
      let errorMessage
      try {
        await req.route.api.post(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-display-email')
    })

    it('should require "@" in display email', async () => {
      global.userProfileFields = ['display-email']
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/create-profile?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        'display-email': 'invalid'
      }
      let errorMessage
      try {
        await req.route.api.post(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-display-email')
    })

    it('should create new profile with display email', async () => {
      global.userProfileFields = ['display-email']
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/create-profile?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        'display-email': user.profile.contactEmail
      }
      const profile = await req.post()
      assert.strictEqual(profile.displayEmail, req.body['display-email'])
    })

    it('should require display name', async () => {
      global.userProfileFields = ['display-name']
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/create-profile?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        'display-name': null
      }
      let errorMessage
      try {
        await req.route.api.post(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-display-name')
    })

    it('should enforce display name lengths', async () => {
      global.userProfileFields = ['display-name']
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/create-profile?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        'display-name': '1'
      }
      global.minimumProfileDisplayNameLength = 10
      global.maximumProfileDisplayNameLength = 100
      let errorMessage
      try {
        await req.route.api.post(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-display-name-length')
      global.minimumProfileDisplayNameLength = 1
      global.maximumProfileDisplayNameLength = 1
      req.body = {
        'display-name': '123456789'
      }
      errorMessage = null
      try {
        await req.route.api.post(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-display-name-length')
    })

    it('should create new profile with display name', async () => {
      global.userProfileFields = ['display-name']
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/create-profile?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        'display-name': user.profile.firstName + ' ' + user.profile.lastName.substring(0, 1)
      }
      const profile = await req.post()
      assert.strictEqual(profile.displayName, req.body['display-name'])
    })

    it('should require date of birth', async () => {
      global.userProfileFields = ['dob']
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/create-profile?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        'dob': null
      }
      let errorMessage
      try {
        await req.route.api.post(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-dob')
    })

    it('should require valid date of birth', async () => {
      global.userProfileFields = ['dob']
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/create-profile?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        'dob': '2017-13-52'
      }
      let errorMessage
      try {
        await req.route.api.post(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-dob')
    })

    it('should accept dob in YYYY-MM-DD', async () => {
      global.userProfileFields = ['dob']
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/create-profile?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        'dob': '2017-11-01'
      }
      const profile = await req.post()
      assert.strictEqual(profile.dob, req.body.dob)
    })

    it('should accept dob in MM-DD-YYYY', async () => {
      global.userProfileFields = ['dob']
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/create-profile?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        'dob': '12-13-1968'
      }
      const profile = await req.post()
      assert.strictEqual(profile.dob, '1968-12-13')
    })

    it('should require unvalidated fields', async () => {
      const fields = ['phone', 'occupation', 'location', 'company-name', 'website']
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/create-profile?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      for (const field of fields) {
        global.userProfileFields = [ field ]
        req.body = {
          [field]: null
        }
        let errorMessage
        try {
          await req.route.api.post(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, `invalid-${field}`)
      }
    })

    it('should save unvalidated fields', async () => {
      const fields = ['phone', 'occupation', 'location', 'company-name', 'website']
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/create-profile?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      for (const field of fields) {
        global.userProfileFields = [field]
        req.body = {
          [field]: 'test value ' + Math.random()
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
        const profile = await req.post()
        assert.strictEqual(profile[displayName], req.body[field])
      }
    })

    it('should create new profile and set as default', async () => {
      global.userProfileFields = ['full-name', 'display-name', 'contact-email', 'display-email', 'dob', 'phone', 'occupation', 'location', 'company-name', 'website']
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/create-profile?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        'first-name': 'Test',
        'last-name': 'Person',
        'contact-email': 'test1@test.com',
        'display-email': 'test2@test.com',
        dob: '2000-01-01',
        'display-name': 'tester',
        phone: '456-789-0123',
        occupation: 'Programmer',
        location: 'USA',
        'company-name': 'Test company',
        website: 'https://example.com',
        default: 'true'
      }
      const profile = await req.post()
      assert.strictEqual(profile.firstName, req.body['first-name'])
      assert.strictEqual(profile.lastName, req.body['last-name'])
      assert.strictEqual(profile.contactEmail, req.body['contact-email'])
      assert.strictEqual(profile.displayEmail, req.body['display-email'])
      assert.strictEqual(profile.companyName, req.body['company-name'])
      assert.strictEqual(profile.website, req.body['website'])
      assert.strictEqual(profile.occupation, req.body['occupation'])
      assert.strictEqual(profile.location, req.body['location'])
      assert.strictEqual(profile.phone, req.body['phone'])
      const req2 = TestHelper.createRequest(`/api/user/account?accountid=${user.account.accountid}`)
      req2.account = user.account
      req2.session = user.session
      const account = await req2.get(req2)
      assert.strictEqual(account.profileid, profile.profileid)
    })

    it('should override global requirements with other settings', async () => {
      global.userProfileFields = ['full-name', 'display-name', 'contact-email', 'display-email', 'dob', 'phone', 'occupation', 'location', 'company-name', 'website']
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/create-profile?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      req.profileFields = ['display-name', 'display-email']
      req.body = {
        'first-name': 'Test',
        'last-name': 'Person',
        'contact-email': 'test1@test.com',
        'display-email': 'test2@test.com',
        dob: '2000-01-01',
        'display-name': 'tester',
        phone: '456-789-0123',
        occupation: 'Programmer',
        location: 'USA',
        'company-name': 'Test company',
        website: 'https://example.com',
        default: 'true'
      }
      const profile = await req.route.api.post(req)
      assert.strictEqual(profile.firstName, undefined)
      assert.strictEqual(profile.lastName, undefined)
      assert.strictEqual(profile.contactEmail, undefined)
      assert.strictEqual(profile.displayEmail, req.body['display-email'])
      assert.strictEqual(profile.displayName, req.body['display-name'])
      assert.strictEqual(profile.companyName, undefined)
      assert.strictEqual(profile.website, undefined)
      assert.strictEqual(profile.occupation, undefined)
      assert.strictEqual(profile.location, undefined)
      assert.strictEqual(profile.phone, undefined)
      const req2 = TestHelper.createRequest(`/api/user/account?accountid=${user.account.accountid}`)
      req2.account = user.account
      req2.session = user.session
      const account = await req2.get(req2)
      assert.strictEqual(account.profileid, profile.profileid)
    })
  })
})
