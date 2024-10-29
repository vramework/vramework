const { execSync } = require('node:child_process')

execSync('npx changeset version')
execSync('YARN_ENABLE_IMMUTABLE_INSTALLS=false yarn install')
