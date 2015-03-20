#!/usr/bin/env node
const Promise = require('bluebird')
const argv = require('minimist')(process.argv.slice(2))
const chalk = require('chalk')
const github = require('./lib/github')
const open = require('opn')

const publish = Promise.promisify(github.publish) 
const auth = Promise.promisify(github.auth) 
const config = Promise.promisify(require('./lib/config')) 
const gitCommit = Promise.promisify(require('./lib/commit')) 
const confirm = Promise.promisify(require('./lib/confirm')) 
const package = Promise.promisify(require('./lib/package')) 

//get organization
var org = argv.o || argv.org
if (org && typeof org !== 'string') {
  console.error("No --org specified")
  process.exit(1)
}

getOpts()
  .then(request)
  .then(publish)
  .then(commit)
  .then(open, err())
  .catch(err())

function request(opt) {
  var pkg = opt.package
  var name = argv.n || argv.name || pkg.name
  var description = pkg.description || ''
  var homepage = pkg.homepage || ''

  if (!name) {
    console.error("No name in package.json")
    process.exit(1)
  }

  if (homepage && homepage.indexOf('https://github.com/') === 0)
    homepage = ''

  var user = opt.org || opt.auth.user
  var repo = [user, name].join('/')
  var url = 'https://github.com/' + repo + '.git'
  repo = chalk.magenta(repo)
  var info = 'Publish new repo as ' + repo + '?'
  return confirm(info)
    .then(function() {
      return {
        org: opt.org,
        name: name,
        description: description,
        homepage: homepage,
        private: argv.p || argv.private,
        team_id: argv.team
      }
    }, function() {
      // user exited early
      process.exit(0) 
    })
}

//commits current working dir, resolves to html_url
function commit(result) {
  var url = result.html_url
  //user opted not to commit anything
  if (argv.b || argv.bare) {
    return Promise.resolve(url)
  }
  return getMessage().then(function(message) {
    return gitCommit({
      message: message,
      url: url + '.git'
    }).catch(function() {
      console.warn(chalk.dim("git commands ignored"))
      return Promise.resolve(url)
    }).then(function() {
      return url
    })
  })
}

function getMessage() {
  var msg = argv.m || argv.message
  if (msg)
    return Promise.resolve(msg)
  var def = 'first commit'
  //try getting it from config
  return config().then(function(conf) {
    return conf.get('init.ghrepo.commit') || def
  }, function(err) {
    //default
    return Promise.resolve(def)
  })
}

function getOpts() {
  return auth({
    configName: 'ghrepo',
    note: 'ghrepo - repo creation tool',
    // noSave: true,
    scopes: ['user', 'repo', 'admin:org', 'read:org', 'write:org']
  })
    .then(function(auth) {
      return [ auth, package() ]
    }, err('Could not authenticate'))
    .spread(function(auth, pkg) {
      return {
        package: pkg,
        org: org,
        auth: auth
      }
    }, err('Error reading package.json'))
}

function err(msg) {
  msg = msg||''
  return function(err) {
    console.error([msg, err.message].join(' ').trim())
    process.exit(1)
  }
}