#!/usr/bin/env node

var fs = require('fs');
var resolve = require('path').resolve;
var app = require('commander');
var Promise = require('bluebird');
var out = require('cli-output');
var helper = require('./helper');
var packageData = require('./package.json');

app
    .version(packageData.version)
    .usage('<spreadsheet-id> [saveas] [options]')
    .option('-b, --beautify', 'Beautify final JSON')
    .option('-e, --esmodule', 'Export with es module')
    .parse(process.argv);

if (app.args.length < 1) {
    app.help();
}

app.spreadsheetId = app.args[0] || app.spreadsheetId;
app.beautify = typeof app.beautify !== 'undefined' ? app.beautify : true;
app.keyDelimiter = "."

var saveas = app.args[1];

helper
    .spreadsheetToJson(app)
    .then(function(result) {
        if (saveas) {
            saveas = resolve(saveas);

            if (!fs.existsSync(saveas)) {
                fs.mkdirSync(saveas);
            }

            Object.keys(result).forEach(function(value) {
                var content = JSON.stringify(result[value], null, app.beautify ? 4 : null);
                var extension = '.json';

                if (app.esmodule) {
                    extension = '.js';
                    content = 'export default ' + content + ';\r\n';
                }

                if (!fs.existsSync(saveas + '/' + value)) {
                    fs.mkdirSync(saveas + '/' + value);
                }
    
                var file = saveas + '/' + value + '/' + 'translations' + extension;
                out.info('Creating ' + file);
                return Promise.promisify(fs.writeFile)(file, content, 'utf-8');
            });
            out.success('Finished!');
        } else {
            out.prettyJSON(result);
        }
    })
    .catch(function(error) {
        out.error(error);
    });
