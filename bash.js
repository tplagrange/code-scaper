const { exec }    = require('child_process')

// TODO: Rate limiting via queues
const run = (binary, args) => {
  let command = binary
  for (var i = 0; i < args.length; i++) {
    command = `${command} ${args[i]}`
  }
  // console.log(`\n${command}\n`)
  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error(err)
    } 
  });
}

module.exports = {
  run
}