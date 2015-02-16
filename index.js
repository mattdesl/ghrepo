
var spawn = require('npm-execspawn')
var concat = require('concat-stream')
// var spawn = require("child_process").spawn
var conf = require('npmconf')
var noop = function (){}
var quote = require('shell-quote').quote
var exec = require('child_process').spawn

module.exports.create = function(opt, done) {
    var cwd = opt.path || process.cwd()
    
}

module.exports.login = function(cb) {
    var proc = spawn('gh user --login', [], { stdio: 'inherit' }) 
    proc.on('exit', function(code) {
        if (code === 0) {
            cb(null)
        } else
            cb(new Error("error code "+code))
    })
}

module.exports.user = function(cb) {
    var proc = spawn('gh user --whoami') 
    proc.stdout.pipe(concat(function(name) {
        name = (name||'').toString().trim()
        if (!name)
            cb(new Error('not logged in'))
        else 
            cb(null, name)
    }))
}

//create GitHub page
module.exports.create = function(opt, cb) {
    cb = cb || noop
    var cmd = [
        'gh', 'repo',
        '--new', opt.name
    ]
    if (opt.user)
        cmd.push('--user', opt.user)
    if (opt.homepage)
        cmd.push('--homepage', opt.homepage)
    if (opt.description)
        cmd.push('--description', opt.description)
    if (opt.private)
        cmd.push('--private')
    
    cmd = quote(cmd)

    var proc = spawn(cmd, [], { stdio: 'inherit' })
    proc.on('exit', function(code) {
        if (code === 0) {
            module.exports.add(opt, cb)
        } else {
            cb(new Error("error code "+ code))
        }
    })
}

//git add + git commit + git push
module.exports.add = function(opt, cb) {
    cb = cb || noop
    var message = opt.message||'first commit'
    message = quote([message])

    var cmd = [
        'git init',
        'git add .',
        'git commit -m '+message,
        'git remote add origin '+opt.url,
        'git push -u origin master'
    ].join(' && ')
    var proc = spawn(cmd, [], { stdio: 'inherit' })
    proc.on('exit', function(code) {
        if (code === 0)
            cb()
        else
            cb(new Error("error code " + code))
    })
}