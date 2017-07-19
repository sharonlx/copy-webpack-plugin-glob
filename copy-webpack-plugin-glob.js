/**
 * Webpack plugin that watches and copies files from build directory
 * to specific directories.
 *
 */

const fs = require('fs');
const fsUtils = require('fs-utils');
const path = require('path');
const glob = require('glob');

const isString = (str) => typeof str === 'string' && str !== '';

function log(msg) {
    console.log('[copy-assets-webpack-plugin] ' + msg); // eslint-disable-line no-console
}

function error(msg) {
    throw '[copy-assets-webpack-plugin] ' + msg;
}

function absolutePath(file, webpackOutput) {
    if (path.isAbsolute(file)) {
        return file;
    }

    return path.resolve(webpackOutput, file);

}

function writeFile(dest, data, fname) {

    fsUtils.mkdirSync(dest);

    fs.stat(dest, (err, stats) => {
        if (err) {
            error(`dest ${dest} ${err.code} is not a valid folder` );

        }
        let fdest = path.isAbsolute(dest) ? dest : path.resolve(dest);
        if (stats.isDirectory()) {
            fdest = path.join(fdest, fname);
        } else if (!stats.isFile()) {
            error(`dest ${dest} is not a file or directoryr`);
        }


        // Copy asset to destination
        fsUtils.writeFile(fdest, data, (err) => {
            if (err) {throw err;}
            log(`Copied ${fdest}`);
        });

    });
}


function CopyAssetsPlugin(options = {}) {
    this.options = options || {};
    if (!this.options.pattern) {
        this.options.pattern = '/**/*.art';

    }


    let _options = this.options;

    const apply = (compiler) => {
        compiler.plugin('done', function (stats) {
            const compilation = stats.compilation;

            let webpackOutput = path.resolve(compilation.outputOptions.path);
            let pattern = path.join(webpackOutput, _options.pattern);

            glob(pattern, {
                cwd: _options.cwd
            }, (err, files) => {
                files.map((file) => {

                    let fname = absolutePath(file, webpackOutput);
                    let dist = _options.dist;
                    let relativePath = path.relative(_options.cwd, fname);

                    fs.readFile(fname, (err, data) => {
                        if (err) {
                            error(`${fname} asset is not part of the bundle`);
                        } else {
                            log(`Copying ${fname}`);
                            let output = relativePath ? relativePath : path.basename(fname);
                            writeFile(dist, data, output);
                        }
                    });
                });
            });

        });
    };

    return {
        apply
    };

}

module.exports = CopyAssetsPlugin;
