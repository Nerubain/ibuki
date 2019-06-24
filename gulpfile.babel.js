import gulp from 'gulp';
import del from 'del';
import browsersync from 'browser-sync';
import plumber from 'gulp-plumber';
import cache from 'gulp-cache';
import gulpif from 'gulp-if';
import pug from 'gulp-pug';
import sass from 'gulp-sass';
import cleanCSS from 'gulp-clean-css';
import autoprefixer from 'gulp-autoprefixer';
import concat from 'gulp-concat';
import terser from 'gulp-terser';
import imagemin from 'gulp-imagemin';
import mozjpeg from 'imagemin-mozjpeg';
import pngquant from 'imagemin-pngquant';
import svgo from 'imagemin-svgo';
import sourcemaps from 'gulp-sourcemaps';

const options = {
  losslessImages: false,
  sourceMaps: false,
  minifyCss: false,
  minifyJs: false,
  concatJs: false,
};

const paths = {
  src: {
    pug: 'src/pug',
    scss: 'src/scss',
    js: 'src/js',
    img: 'src/img',
  },

  build: {
    html: 'build',
    css: 'build/css',
    js: 'build/js',
    img: 'build/img',
  },
};

// pug
gulp.task('pug', () =>
  gulp
    .src([`${paths.src.pug}/*.pug`, `${paths.src.pug}/pages/*.pug`])
    .pipe(plumber())
    .pipe(pug())
    .pipe(gulp.dest(paths.build.html)),
);

//  css
gulp.task('sass', () =>
  gulp
    .src([`${paths.src.scss}/**/*.scss`])
    .pipe(plumber())
    .pipe(gulpif(options.sourceMaps, sourcemaps.init()))
    .pipe(sass())
    .pipe(autoprefixer())
    .pipe(
      gulpif(
        options.minifyCss,
        cleanCSS({
          level: 2,
        }),
      ),
    )
    .pipe(gulpif(options.sourceMaps, sourcemaps.write('../maps')))
    .pipe(gulp.dest(paths.build.css))
    .pipe(browsersync.stream()),
);

// js
gulp.task('javascript', () =>
  gulp
    .src(`${paths.src.js}/**/*.js`)
    .pipe(plumber())
    .pipe(gulpif(options.sourceMaps, sourcemaps.init()))
    .pipe(gulpif(options.concatJs, concat('script.js')))
    .pipe(gulpif(options.minifyJs, terser()))
    .pipe(gulpif(options.sourceMaps, sourcemaps.write('../maps')))
    .pipe(gulp.dest(paths.build.js)),
);

// images
gulp.task('imagemin', () =>
  gulp
    .src('src/img/*')
    .pipe(gulpif(options.losslessImages, imagemin()))
    .pipe(
      gulpif(
        !options.losslessImages,
        cache(
          imagemin(
            [
              pngquant(),
              svgo({
                plugins: [
                  {
                    removeViewBox: true,
                  },
                ],
              }),
              mozjpeg({
                progressive: true,
              }),
            ],
            {
              verbose: true,
            },
          ),
        ),
      ),
    )
    .pipe(gulp.dest(paths.build.img)),
);

// service
gulp.task('clean', () => del('build/*'));

gulp.task('watch', () => {
  gulp.watch([`${paths.src.pug}/**/*.pug`], gulp.series('pug'));
  gulp.watch([`${paths.src.scss}/**/*.scss`], gulp.series('sass'));
  gulp.watch([`${paths.src.js}/**/*.js`], gulp.series('javascript'));
});

gulp.task('serve', () => {
  browsersync.init({
    server: 'build',
  });

  browsersync
    .watch([`${paths.src.pug}/**/*.pug`, `${paths.src.js}/**/*.js`])
    .on('change', browsersync.reload);
});

// modes
gulp.task('build', gulp.series('clean', 'pug', 'sass', 'javascript', 'imagemin'));

gulp.task('dev', gulp.series('build', gulp.parallel('watch', 'serve')));

gulp.task('default', gulp.parallel('watch', 'serve'));
