import fs from 'fs'
import path from 'path'

const inputDir = `../../templates`
const folders = fs.readdirSync(inputDir)
    .filter(file => fs.statSync(path.join(inputDir, file)).isDirectory())
fs.writeFileSync('src/template-names.json', JSON.stringify(folders, null, 2))
