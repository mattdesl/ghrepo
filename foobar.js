var argv = {}
commit()

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
      return Promise.resolve(url)
    }).then(function () {
      // some stuff
      return url
    })
  })
}

function getMessage () {

}

function gitCommit () {

}
