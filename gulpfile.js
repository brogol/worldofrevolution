'use strict';

const del           = require('del'),
      fs            = require('fs'),
      matter        = require('gray-matter'),
      gulp          = require('gulp'),
      autoprefixer  = require('gulp-autoprefixer'),
      data          = require('gulp-data'),
      nunjucks      = require('gulp-nunjucks-render'),
      sass          = require('gulp-sass'),
      server        = require('gulp-server-livereload'),
      yaml          = require('js-yaml'),
      path          = require('path');

// Config var
var config = {
  dest: 'public',
}

// Compile scss to css
gulp.task('sass', function() {
  return gulp.src('./sass/**/*.scss')
    .pipe(sass({
      outputStyle: 'compressed'
    })).on('error', sass.logError)
    .pipe(autoprefixer())
    .pipe(gulp.dest('./' + config.dest + '/css'));
});

// Get global data
function getSiteData () {
  var site;
  site = matter.read('./data/site.yml').data;
  site.time = Math.floor(Date.now() / 1000);

  return site;
}

// Render nunjucks templating
gulp.task('render', function () {
  return gulp.src('./pages/**/*.njk')
    .pipe(data(function (file) {
      // Get front matter data
      var source = matter(String(file.contents));
      file.contents = new Buffer(source.content);

      // Data for template
      var json = source.data;
      json.site = getSiteData();
      // json.faq = matter.read('./data/faq.yml').data;

      // Rename path to URI config
      file.path = path.normalize( config.dest + '/' + json.uri);

      // Get relative base path
      json.site.path = path.relative(file.path, config.dest);
      if(!json.site.path.length) {
        json.site.path = '.';
      }

      // Simulate nice urls
      file.path += '/index.html';

      return json;
    }))
    .pipe(nunjucks({
      manageEnv: function(env) {
        // slugify a string
        env.addFilter('slugify', function(str) {
          return str.toString().toLowerCase().trim().replace(/[^a-zA-Z0-9À-ÿ-]+/g, '-');
        });
      }
    }))
    .pipe(gulp.dest('./' + config.dest));
});

// Server with livereload
gulp.task('server', function() {
  gulp.src('./' + config.dest)
    .pipe(server({
      livereload: true,
      open: true,
    }));
});

// Watch file changes
gulp.task('watch', function () {
  gulp.watch(
    ['**/*.scss', '**/*.njk', '**/*.yml'],
    ['sass', 'render']
  ).on('change', function (event) {
    del.sync([config.dest + '/**/*', '!' + config.dest + '/assets/**']);
  });
});

// Default task
gulp.task('default', ['sass', 'render', 'server', 'watch']);