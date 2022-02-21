// Not transpiled with TypeScript or Babel, so use plain Es6/Node.js!
module.exports = {
  // This function will run for each entry/format/env combination
  rollup(config, options) {
    const outputFile = config.output.file
    config.output.file = outputFile.replace('zeatreeview', 'index')

    return config // always return a config.
  },
}
