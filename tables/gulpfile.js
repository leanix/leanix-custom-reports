var gulp = require('gulp');
var serve = require('gulp-serve');
var concat = require('gulp-concat');
var del = require('del');
var react = require('gulp-react');

var browserSync = require('browser-sync');
var reload = browserSync.reload;

gulp.task('default', ['dist'], function() {});

gulp.task('clean', function() {
  return del(['dist']);
});

gulp.task('copy', ['clean'], function() {
  return gulp.src(['./src/index.html'])
    .pipe(gulp.dest('./dist/'));
});

gulp.task('dist_css', ['copy'], function() {
  return gulp.src([
      './node_modules/bootstrap/dist/css/bootstrap.css',
      './node_modules/react-bootstrap-table/css/react-bootstrap-table.css',
      './src/index.css'
    ])
    .pipe(concat('index.css'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('dist_fonts', ['copy'], function() {
    return gulp.src([
            './node_modules/bootstrap/dist/fonts/glyph*',
        ])
        .pipe(gulp.dest('./dist/fonts/'));
});

gulp.task('dist', ['copy', 'dist_css', 'dist_fonts'], function() {
  return gulp.src([
      './node_modules/jquery/dist/jquery.js',
      './node_modules/react/dist/react-with-addons.js',
      './node_modules/react-dom/dist/react-dom.js',
      './node_modules/accounting/accounting.js',
      './node_modules/react-bootstrap-table/dist/react-bootstrap-table.js',
      './node_modules/lodash/lodash.js',
      './src/js/ReportSetup.js',
      './src/js/FactSheetIndex.js',
      './src/js/ReportCapabilitySpend.js',
      './src/js/ReportProcessSpend.js',
      './src/js/ReportHierarchy.js',
      './src/js/ReportDataQuality.js',
      './src/js/ReportDataQualityServices.js',
      './src/js/ReportApplicationLifecycle.js',
      './src/js/App.js'
    ])
    .pipe(react())
    .pipe(concat('index.js'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('watch', ['dist'], function() {

    browserSync({
        notify: false,
        logPrefix: 'BS',
        // Run as an https by uncommenting 'https: true'
        // Note: this uses an unsigned certificate which on first access
        //       will present a certificate warning in the browser.
        https: true,
        server: ['dist']
    });

    // Watch .html files
    gulp.watch(['src/*.*', 'src/js/*.*'], ['dist', reload]);
});
