var
  gulp         = require('gulp-help')(require('gulp')),
  runSequence  = require('run-sequence'),
  buildJS      = require('./dev-build-js'),
  buildCSS     = require('./dev-build-css'),
  buildAssets  = require('./../build/assets'),
  install      = require('./../config/project/install'),

  tasks = [];


  require('../collections/internal')(gulp);


// in case these tasks are undefined during import, less make sure these are available in scope
gulp.task('build-js-dev', 'Builds all javascript from source', buildJS);
gulp.task('build-css-dev', 'Builds all css from source', buildCSS);
gulp.task('build-assets', 'Copies all assets from source', buildAssets);



module.exports = function(callback) {

    console.info('Building Semantic for Development purpose');

    if( !install.isSetup() ) {
      console.error('Cannot find semantic.json. Run "gulp install" to set-up Semantic');
      return;
    }

    tasks.push('build-js-dev');
    tasks.push('build-css-dev');
    tasks.push('build-assets');

    runSequence(tasks, callback);
};
