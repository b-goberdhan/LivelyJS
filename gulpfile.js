const gulp = require('gulp');

const uglifyes = require('uglify-es');
const composer = require('gulp-uglify/composer');
const uglify = composer(uglifyes, console);

const jshint = require('gulp-jshint');


gulp.task('minify', () => {
    return gulp.src('src/**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('dist'));
});

gulp.task('jshint', () => {
    return gulp.src('src/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('watch', () => {
   gulp.watch('src/**/*.js', gulp.series('jshint'));
});

gulp.task('default', gulp.series('watch'));