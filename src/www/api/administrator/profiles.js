const dashboard = require('../../../../index.js')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    let profileids
    if (req.query.all) {
      profileids = await dashboard.StorageList.listAll(`${req.appid}/profiles`)
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      profileids = await dashboard.StorageList.list(`${req.appid}/profiles`, offset, limit)
    }
    if (!profileids || !profileids.length) {
      return null
    }
    req.cacheData = await dashboard.Storage.readMany(`${req.appid}/profile`, profileids)
    const profiles = []
    for (const profileid of profileids) {
      req.query.profileid = profileid
      const profile = await global.api.administrator.Profile.get(req)
      profiles.push(profile)
    }
    return profiles
  }
}
