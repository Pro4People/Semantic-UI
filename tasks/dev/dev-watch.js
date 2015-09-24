
/*******************************
           Watch Task
*******************************/

var
  gulp         = require('gulp-help')(require('gulp')),

  // node dependencies
  console      = require('better-console'),
  fs           = require('fs'),

  // gulp dependencies
  autoprefixer = require('gulp-autoprefixer'),
  chmod        = require('gulp-chmod'),
  clone        = require('gulp-clone'),
  gulpif       = require('gulp-if'),
  less         = require('gulp-less'),
  plumber      = require('gulp-plumber'),
  print        = require('gulp-print'),
  rename       = require('gulp-rename'),
  replace      = require('gulp-replace'),
  util         = require('gulp-util'),
  watch        = require('gulp-watch'),

  // user config
  config       = require('../config/user'),

  // task config
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
  settings     = tasks.settings,

  buildJS      = require('./dev-build-js'),
  buildCSS     = require('./dev-build-css'),
  postCss      = require('gulp-postcss')

;

require('../collections/internal')(gulp);


/*--------------
Find Source
---------------*/
function findSource(source, file) {
    var
        lessPath = false,
        isPackagedTheme,
        isSiteTheme,
        isConfig
    ;

    // recompile on *.override , *.variable change
    isConfig        = (file.path.indexOf('theme.config') !== -1 || file.path.indexOf('site.variables') !== -1 ||        file.path.indexOf('semantic-dev.css') !== -1);
    isPackagedTheme = (file.path.indexOf(source.themes) !== -1);
    isSiteTheme     = (file.path.indexOf(source.site) !== -1);

    if(isConfig) {
      console.info('Rebuilding all UI');
      // impossible to tell which file was updated in theme.config, rebuild all
      gulp.start('build-css-dev');
    }
    else if(isPackagedTheme) {
      console.log('Change detected in packaged theme');
      lessPath = util.replaceExtension(file.path, '.less');
      lessPath = lessPath.replace(tasks.regExp.theme, source.definitions);
    }
    else if(isSiteTheme) {
      console.log('Change detected in site theme');
      lessPath = util.replaceExtension(file.path, '.less');
      lessPath = lessPath.replace(source.site, source.definitions);
    }
    else {
      console.log('Change detected in definition');
      lessPath = file.path;
    }

    return lessPath;
}

function watchCss(source, file) {

    // log modified file
    gulp.src(file.path)
      .pipe(print(log.modified))
    ;

    var lessPath = findSource(source, file);

    if (lessPath === false) {
        return;
    }

    /*--------------
       Create CSS
    ---------------*/

    if( fs.existsSync(lessPath) ) {

        var
            processors = [
                require('postcss-url')({basePath: source.resources, url: 'inline'})
            ]
          ;

          // unified css stream
          gulp.src(lessPath)
            .pipe(plumber(settings.plumber.less))
            .pipe(less(settings.less))
            .pipe(print(log.created))
            .pipe(postCss(processors))
            .pipe(autoprefixer(settings.prefix))
            .pipe(gulp.dest(output.uncompressed))
          ;

    }
    else {
      console.log('Cannot find UI definition at path', lessPath);
    }
}

// export task
module.exports = function() {

  if( !install.isSetup() ) {
    console.error('Cannot watch files. Run "gulp install" to set-up Semantic');
    return;
  }

  // check for right-to-left (RTL) language
  if(config.rtl === 'both') {
    gulp.start('watch-rtl');
  }
  if(config.rtl === true || config.rtl === 'Yes') {
    gulp.start('watch-rtl');
    return;
  }


  console.log('Watching source files for changes');

  /*--------------
      Watch CSS
  ---------------*/

  gulp
    .watch([
      source.config,
      source.definitions   + '/**/*.less',
      source.site          + '/**/*.{overrides,variables}',
      source.site          + '/semantic-dev.css',
      source.themes        + '/**/*.{overrides,variables}'
    ], watchCss.bind(this, source))
  ;

  /*--------------
      Watch JS
  ---------------*/

  gulp
    .watch([
      source.definitions   + '/**/*.js'
    ], function(file) {
      gulp.src(file.path)
        .pipe(plumber())
        .pipe(flatten())
        .pipe(gulp.dest(output.uncompressed))
        .pipe(print(log.created))
        .on('end', function() {
          gulp.start('package uncompressed js');
        })
      ;
    })
  ;



  /*--------------
  Watch Assets
---------------*/

// only copy assets that match component names (or their plural)
gulp
  .watch([
    source.themes   + '/**/assets/**/*.*'
  ], function(file) {
    // copy assets
    gulp.src(file.path, { base: source.themes })
      .pipe(gulpif(config.hasPermission, chmod(config.permission)))
      .pipe(gulp.dest(output.themes))
      .pipe(print(log.created))
    ;
  })
;

};
