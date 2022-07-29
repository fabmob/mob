const pkg = require(process.env.PROJECT_PATH+"/package.json")
pkg.name = process.env.PROJECT_KEY
var json = JSON.stringify(pkg);
var fs = require('fs');
fs.writeFileSync(process.env.PROJECT_PATH+'/package.json', json);
