#!/usr/bin/env node
const Promise = require('bluebird')
const argv = require('minimist')(process.argv.slice(2))
const chalk = require('chalk')
const github = require('./lib/github')
const open = require('opn')
const path = require('path')
const noop = require('no-op')
const baseName = require('require-package-name').base
const githubUrl = require('github-url-to-object')

const publish = Promise.promisify(github.publish) 
const auth = Promise.promisify(github.auth) 
const config = Promise.promisify(require('./lib/config')) 
const gitCommit = Promise.promisify(require('./lib/commit')) 
const confirm = Promise.promisify(require('./lib/confirm')) 
const loadPackage = Promise.promisify(require('./lib/package')) 

//get organization
var org = argv.o || argv.org
if (org && typeof org !== 'string') {
  console.error("No --org specified")
  process.exit(1)
}

  
if (argv.v || argv.version) {
  var version = require('./package.json').version
  console.log(version)
  return
}

if (argv.help) {
  require('fs').createReadStream(path.join(__dirname, 'lib', 'help.txt'))
      .pipe(process.stdout)
  return
}

var dryRun = argv['dry-run']
if (dryRun) {
  console.error(chalk.grey("(dry run)"))
  start()
      .then(function(result) {
        console.log(JSON.stringify(result))
      })
      .catch(err())
} else {
  start()
    .then(publish)
    .then(commit)
    .then(argv.open !== false ? open : noop, err())
    .catch(err())
}

function start() {
  return getOpts().then(request)
}
  
function request(opt) {
  var pkg = opt.package
  var name = argv.n || argv.name || baseName(pkg.name)
  var description = argv.d || argv.description || pkg.description || ''
  var homepage = argv.h || argv.homepage || pkg.homepage || ''

  if (!name) {
    console.error("No name in package.json")
    process.exit(1)
  }

  if (homepage && homepage.indexOf('https://github.com/') === 0)
    homepage = ''
  
  var user = opt.org
  // try to glean default username from package.json repository URL
  if (!user && pkg.repository && pkg.repository.url) {
    var urlObj = githubUrl(pkg.repository.url)
    if (urlObj) {
      user = urlObj.user
    }
  }
  user = user || opt.auth.user
  
  var repo = [user, name].join('/')
  var url = 'https://github.com/' + repo + '.git'
  repo = chalk.magenta(repo)
  var info = 'Publish new repo as ' + repo + '?'
  var data = {
    org: user,
    name: name,
    description: description,
    homepage: homepage,
    private: argv.p || argv.private,
    team_id: argv.team
  }
  
  if (dryRun) {
    return data
  }

  return confirm(info)
    .then(function() {
      return data
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
    return conf.get('init.ghrepo.message') || def
  }, function(err) {
    //default
    return Promise.resolve(def)
  })
}

function getOpts() {
  return auth({
    configName: 'ghrepo',
    note: 'ghrepo - repo creation tool',
    scopes: ['user', 'repo']
  })
    .then(function(auth) {
      return [ auth, getPackage() ]
    }, err('Could not authenticate'))
    .spread(function(auth, pkg) {
      return {
        package: pkg,
        org: org,
        auth: auth
      }
    }, err('Error reading package.json'))
}

function getPackage() {
  return loadPackage()
    .then(null, function(err) {
      console.warn(chalk.bgYellow("WARN"), chalk.magenta("could not open package.json"))
      console.warn(chalk.dim(err.message))
      return Promise.resolve({
        name: path.basename(process.cwd())
      })
    })
}

function err(msg) {
  msg = msg||''
  return function(err) {
    console.error([msg, err.message].join(' ').trim())
    process.exit(1)
  }
}