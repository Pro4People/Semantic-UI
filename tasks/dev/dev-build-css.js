/*******************************
          Build Task
*******************************/

var
  gulp         = require('gulp'),
  semanticTasksPath = './../node_modules/semantic-ui/tasks/',

  // node dependencies
  console      = require('better-console'),
  fs           = require('fs'),

  // gulp dependencies
  chmod        = require('gulp-chmod'),
  clone        = require('gulp-clone'),
  flatten      = require('gulp-flatten'),
  gulpif       = require('gulp-if'),
  less         = require('gulp-less'),
  plumber      = require('gulp-plumber'),
  print        = require('gulp-print'),
  rename       = require('gulp-rename'),
  replace      = require('gulp-replace'),
  postCss      = require('gulp-postcss'),
  autoprefixer = require('gulp-autoprefixer'),


  // config
  config       = require('../config/user'),
  tasks        = require('../config/tasks'),
  install      = require('../config/project/install'),

  // shorthand
  globs        = config.globs,
  assets       = config.paths.assets,
  output       = config.paths.output,
  source       = config.paths.source,


  banner       = tasks.banner,
  comments     = tasks.regExp.comments,
  log          = tasks.log,
  settings     = tasks.settings
;


// add internal tasks (concat release)
require('../collections/internal')(gulp);


//Copy file with all import for each component needed. TODO: create file from component array listed in semantic.json
gulp.task('export-css', 'Export semantic-dev.css', function () {
    return gulp.src(source.site + '/semantic-dev.css')
        .pipe(gulpif(config.hasPermission, chmod(config.permission)))
        .pipe(rename('semantic.css'))
        .pipe(gulp.dest(output.packaged))
        .pipe(print(log.created))
    ;

});

module.exports = function() {

  var
    //needed because of the path difference
    processors = [
        require('postcss-url')({basePath: source.resources + '/images', url: 'inline'})
    ]
  ;

  console.info('Building CSS');

  if( !install.isSetup() ) {
    console.error('Cannot build files. Run "gulp install" to set-up Semantic');
    return;
  }

//unified css stream
 gulp.src(source.definitions + '/**/' + globs.components + '.less')
    .pipe(plumber(settings.plumber.less))
    .pipe(less(settings.less))
    .pipe(postCss(processors))
    .pipe(autoprefixer(settings.prefix))
    .pipe(flatten())
    .pipe(gulp.dest(output.uncompressed))
    .pipe(print(log.created))
  ;

  gulp.start('export-css');

};
