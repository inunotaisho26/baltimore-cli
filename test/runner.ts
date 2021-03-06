import * as glob from 'glob';
import Mocha = require('mocha');

let mocha = new Mocha({
    timeout: 5000,
    reporter: 'spec'
});

let root = __dirname + '/unit/';

function addFiles(mocha, files): void {
    glob.sync(root + files).forEach(mocha.addFile.bind(mocha));
}

addFiles(mocha, '**/*.test.js');

mocha.run((failures) => {
    process.on('exit', () => {
        process.exit(failures);
    });
});
