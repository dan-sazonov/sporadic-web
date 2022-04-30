const projectFolder = 'dist';
const sourceFolder = 'src';
const path = {
  build: {
    html: `${projectFolder}/`,
    css: `${projectFolder}/css/`,
    js: `${projectFolder}/js/`,
  },
  src: {
    html: `${sourceFolder}/*.html`,
    css: `${sourceFolder}/css/styles.scss`,
    js: ['src/js/tmp/main.js', 'src/js/modernizr.min.js', 'src/js/plugins.js'],
  },
  watch: {
    html: `${sourceFolder}/**/*.html`,
    css: `${sourceFolder}/css/**/*.scss`,
    js: `${sourceFolder}/**/*.js`,
  },
  scripts: {
    main: `${sourceFolder}/js/main.js`,
    modernizr: `${sourceFolder}/js/modernizr.min.js`,
  },
  clean: `./${projectFolder}/`,
  lint: [`${sourceFolder}/js/**/*.js`, './*.js'],
};

// переменные плагинов
const {src, dest} = require('gulp');
const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const fileInclude = require('gulp-file-include');
const del = require('del');
const autoprefixer = require('gulp-autoprefixer');
const groupMedia = require('gulp-group-css-media-queries');
const cleanCSS = require('gulp-clean-css');
const eslint = require('gulp-eslint');
const sass = require('gulp-sass');
const {exec} = require('child_process');

function html() {
  return src(path.src.html)
    .pipe(fileInclude())
    .pipe(dest(path.build.html))
    .pipe(browserSync.stream());
}

function css() {
  return src(path.src.css)
    .pipe(sass())
    .pipe(groupMedia())
    .pipe(
      autoprefixer({
        overrideBrowserslist: ['last 5 versions'],
        cascade: true
      })
    )
    .pipe(cleanCSS())
    .pipe(dest(path.build.css))
    .pipe(browserSync.stream());
}

function js(done) {
  exec('npm run webpack-dev');
  done();
  return src('./').pipe(browserSync.stream());
}

gulp.task('browser_sync', () => {
  browserSync.init({
    server: {
      baseDir: `./${projectFolder}/`
    },
    port: 3000,
    browser: 'firefox'
  });
});

gulp.task('jsProd', (done) => {
  exec('npm run webpack-build');
  done();
  return src('./').pipe(browserSync.stream());
});

gulp.task('copyLibs', () => src([path.scripts.modernizr])
  .pipe(dest(path.build.js))
  .pipe(browserSync.stream()));

gulp.task('watchFiles', () => {
  gulp.watch(path.watch.html, html);
  gulp.watch(path.watch.css, css);
  gulp.watch(path.watch.js, js);
});

gulp.task('clean', () => del(path.clean));

gulp.task('linter', () => src(path.lint)
  .pipe(eslint())
  .pipe(eslint.format()));

gulp.task('build', gulp.series('clean', js, gulp.parallel(html, css, 'copyLibs')));
gulp.task('prod', gulp.series('clean', 'jsProd', gulp.parallel(html, css, 'copyLibs')));
gulp.task('dev', gulp.series('linter', gulp.parallel('build', 'watchFiles', 'browser_sync')));
gulp.task('default', gulp.parallel('dev'));
