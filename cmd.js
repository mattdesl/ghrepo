#!/usr/bin/env node
var ghrepo = require('./')
var argv = require('minimist')(process.argv.slice(2))
var path = require('path')
var fs = require('fs')
var chalk = require('chalk')
var conf = require('npmconf')

var cwd = argv.dir || process.cwd()

fs.readFile(path.join(cwd, 'package.json'), 'utf8', function(err, data) {
    if (err) {
        console.error("Error reading package.json:", err)
        process.exit(1)
    }
    try { 
        data = JSON.parse(data)
    } catch (e) {
        console.error("Error parsing package.json", e)
        process.exit(1)
    }

    getUser(function(err, name) {
        if (err) {
            console.error(chalk.red(err.message))
            process.exit(1)
        }
        start(name, data)
    })
})

function start(user, pkg) {
    var message = argv.message || argv.m
    var name = argv.n || argv.name || pkg.name
    var description = pkg.description || ''
    var homepage = pkg.homepage || ''

    if (!name) {
        console.error("No name in package.json")
        process.exit(1)
    }

    if (homepage && homepage.indexOf('https://github.com/') === 0)
        homepage = ''

    var repo = [user, name].join('/')
    var url = 'https://github.com/'+repo+'.git'
    repo = chalk.magenta(repo)
    var msg = 'Publish new repo as '+repo+'?'
    var inquirer = require("inquirer");
    inquirer.prompt([
        { 
            type: 'confirm',
            name: 'confirm',
            message: msg
        }
    ], function(answers) {
        if (answers.confirm) {
            ghrepo.create({
                user: user,
                name: name,
                description: description,
                homepage: homepage,
                message: message,
                url: url,
                private: argv.p || argv.private
            })
        }
    })    
}

function getUser(cb) {
    var org = argv.o || argv.org
    if (org && typeof org !== 'string') {
        console.error("No --org specified")
        process.exit(1)
    }

    if (org)
        cb(null, org)
    else {
        conf.load({}, function(err, config) {
            if (err) return cb(err)

            var name = config.get('init.author.github')
            if (!name) 
                return cb(new Error([
                    'Missing config. Run the following with your own username:',
                    '  >  npm config set init.author.github "your-github-handle"'
                ].join('\n')))
            else
                return cb(null, name)
        })
    }
}