const replace = require('replace-in-file');

const options = {
  files: process.argv[2],
  from: RegExp(process.argv[3], 'g'),
  to: process.argv[4],
};

try {
  console.log(options);
  let changedFiles = replace.sync(options);
  console.log('Modified files:', changedFiles.join(', '));
} catch (error) {
  console.error('Error occurred:', error);
}
