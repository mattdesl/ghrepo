var fs = require('fs')
var path = require('path')
var noop = require('no-op')

module.exports = function(cb) {
  cb = cb||noop
  var cwd = process.cwd()
  fs.readFile(path.join(cwd, 'package.json'), 'utf8', function(err, data) {
    if (err) return cb(err)
    try {
      data = JSON.parse(data)
    } catch (e) {
      return cb(e)
    }
    cb(null, data)
  })
}