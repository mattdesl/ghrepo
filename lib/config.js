var conf = require('npmconf')

module.exports = function config(cb) {
  conf.load({}, cb)
}