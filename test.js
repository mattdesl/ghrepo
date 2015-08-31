var path = require('path')
var spawn = require('win-spawn')
var test = require('tape')
var concat = require('concat-stream')

var cliPath = path.resolve('./cmd.js')
var expected = require('./package.json')

test('should dry run and get correct package details', function(t) {
  var proc = spawn(cliPath, ['--dry-run'])
  proc.stdout.pipe(concat(function(body) {
    var data = JSON.parse(body.toString())
    t.equal(data.name, expected.name, 'matches name')
    t.equal(data.user, 'mattdesl', 'matches user')
    t.equal(data.description, expected.description, 'matches description')
    t.equal(data.homepage, '', 'homepage is the same as repo so ignored')
  }))
  proc.on('exit', function() {
    t.ok(true, 'closed')
  })
  t.plan(5)
})