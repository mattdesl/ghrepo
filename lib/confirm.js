var inquirer = require('inquirer')

module.exports = function (message, cb) {
  inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: message
  }], function (answers) {
    if (answers.confirm) {
      cb(null)
    } else {
      cb(new Error('cancelled'))
    }
  })
}
