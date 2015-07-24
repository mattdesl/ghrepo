var auth = require('ghauth')
var GitHubApi = require('github')

var github = new GitHubApi({
    debug: false,
    host: 'api.github.com',
    protocol: 'https',
    version: '3.0.0'
})

//Creates a new repo on user/org
module.exports.publish = function(opt, cb) {
  var result = function(err, data) {
    //not sure why github returns a JSON string??
    if (err) {
      if (typeof err.message === 'string') {
        try { 
          var errDat = JSON.parse(err.message) || {}
          var err0 = (errDat.errors && errDat.errors[0] && errDat.errors[0].message)
          err = err0 ? [errDat.message, err0].join(': ') : errDat.message
        } catch (e) {
          err = 'Could not publish to GitHub'
        }
      }
      return cb(new Error(err), data)
    }
    cb(null, data)
  }

  if (opt.org) {
    github.repos.createFromOrg(opt, result)
  }
  else
    github.repos.create(opt, result)
}

module.exports.auth = function(opt, cb) {
  auth(opt, function(err, data) {
    if (err) return cb(err)
    github.authenticate({
      type: 'oauth',
      token: data.token
    })
    cb(null, data)
  })
}