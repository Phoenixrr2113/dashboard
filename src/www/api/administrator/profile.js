const dashboard = require('../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.profileid) {
      throw new Error('invalid-profileid')
    }
    let profile = await dashboard.Storage.read(`${req.appid}/profile/${req.query.profileid}`)
    if (!profile) {
      throw new Error('invalid-profileid')
    }
    try {
      profile = JSON.parse(profile)
    } catch (error) {
    }
    if (!profile || profile.object !== 'profile') {
      throw new Error('invalid-profileid')
    }
    return profile
  }
}
