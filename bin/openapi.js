#!/usr/bin/env node
const path = require('path');
const { generateFile, generateConfigFile } = require('../lib');

function run() {
  const [runType, fileDir = 'openapi'] = process.argv.slice(2);

  if (runType === 'init') {
    generateConfigFile(fileDir);
  } else {
    const config = require(path.join(process.cwd(), fileDir, 'openapi.config.js'));
    generateFile(config);
  }
}

run();
