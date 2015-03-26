#!/usr/bin/env node
const Promise = require('bluebird')
const argv = require('minimist')(process.argv.slice(2))
const chalk = require('chalk')
const github = require('./lib/github')
const open = require('opn')
const path = require('path')
const noop = require('no-op')

const publish = Promise.promisify(github.publish)
const auth = Promise.promisify(github.auth)
const config = Promise.promisify(require('./lib/config'))
const gitCommit = Promise.promisify(require('./lib/commit'))
const promptConfirm = Promise.promisify(require('./lib/confirm'))
const readPackage = Promise.promisify(require('./lib/package'))

// get organization
var org = argv.o || argv.org
if (org && typeof org !== 'string') {
  console.error('No --org specified')
  process.exit(1)
}

getOpts()
  .then(request)
  .then(publish)
  .then(commit)
  .then(argv.open !== false ? open : noop, error())
  .catch(error())

function request (opt) {
  var pkg = opt.package
  var name = argv.n || argv.name || pkg.name
  var description = argv.d || argv.description || pkg.description || ''
  var homepage = argv.h || argv.homepage || pkg.homepage || ''

  if (!name) {
    console.error('No name in package.json')
    process.exit(1)
  }

  if (homepage && homepage.indexOf('https://github.com/') === 0) {
    homepage = ''
  }

  var user = opt.org || opt.auth.user
  var repo = [user, name].join('/')
  repo = chalk.magenta(repo)
  var info = 'Publish new repo as ' + repo + '?'
  return promptConfirm(info)
    .then(function () {
      return {
        org: opt.org,
        name: name,
        description: description,
        homepage: homepage,
        private: argv.p || argv.private,
        team_id: argv.team
      }
    }, function () {
      process.exit(0) // user exited early
    })
}

// commits current working dir, resolves to html_url
function commit (result) {
  var url = result.html_url
  // user opted not to commit anything
  if (argv.b || argv.bare) {
    return Promise.resolve(url)
  }
  return getMessage().then(function (message) {
    return gitCommit({
      message: message,
      url: url + '.git'
    }).catch(function () {
      console.warn(chalk.dim("git commands ignored"))
      return Promise.resolve(url)
    }).then(function () {
      return url
    })
  })
}

function getMessage () {
  var msg = argv.m || argv.message
  if (msg) {
    return Promise.resolve(msg)
  }
  var def = 'first commit'
  // try getting it from config
  return config().then(function (conf) {
    return conf.get('init.ghrepo.message') || def
  }, function (err) {
    console.error(chalk.bgYellow('WARN'), chalk.magenta("could not load npm config"))
    console.error(chalk.dim(err.message))
    // default
    return Promise.resolve(def)
  })
}

function getOpts () {
  return auth({
    configName: 'ghrepo',
    note: 'ghrepo - repo creation tool',
    scopes: ['user', 'repo']
  })
    .then(function (authData) {
      return [ authData, getPackage() ]
    }, error('Could not authenticate'))
    .spread(function (authData, pkg) {
      return {
        package: pkg,
        org: org,
        auth: authData
      }
    }, error('Error reading package.json'))
}

function getPackage () {
  return readPackage()
    .then(null, function (err) {
      console.error(chalk.bgYellow('WARN'), chalk.magenta("could not open package.json"))
      console.error(chalk.dim(err.message))
      return Promise.resolve({
        name: path.basename(process.cwd())
      })
    })
}

function error (msg) {
  msg = msg || ''
  return function (err) {
    console.error([msg, err.message].join(' ').trim())
    process.exit(1)
  }
}
