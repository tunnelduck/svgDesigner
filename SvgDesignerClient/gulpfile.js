var ts = require('gulp-typescript');
var gulp = require('gulp');
var clean = require('gulp-clean');

var destPath = './wwwroot/libs/';

// Delete the dist directory
gulp.task('clean', function () {
    return gulp.src(destPath)
        .pipe(clean());
});

gulp.task("scriptsNStyles", () => {

    gulp.src([
        'node_modules/bootstrap/dist/css/bootstrap.css'
    ]).pipe(gulp.dest('./wwwroot/libs/css'));
});

var tsProject = ts.createProject('./tsconfig.json');
gulp.task('ts', function (done) {
    //var tsResult = tsProject.src()
    var tsResult = gulp.src([
            "./scripts/**/*.ts"
    ])
        .pipe(ts(tsProject), undefined, ts.reporter.fullReporter());
    return tsResult.js.pipe(gulp.dest('./wwwroot/appScripts'));
});

gulp.task('watch', ['watch.ts']);

gulp.task('watch.ts', ['ts'], function () {
    return gulp.watch('scripts/*.ts', ['ts']);
});

gulp.task('default', ['scriptsNStyles', 'watch']);











var watchify = require('watchify');
var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var sourcemaps = require('gulp-sourcemaps');
var assign = require('lodash').assign;
var tsify = require('tsify');

// add custom browserify options here
var customOpts = {
    entries: ['./scripts/main.ts'],
    debug: true
};
var opts = assign({}, watchify.args, customOpts);
var b = watchify(browserify(opts));

// add transformations here
// i.e. b.transform(coffeeify);
b.plugin(tsify, { noImplicitAny: true });

gulp.task('js', bundle); // so you can run `gulp js` to build the file
b.on('update', bundle); // on any dep update, runs the bundler
b.on('log', gutil.log); // output build logs to terminal

function bundle() {
    return b

      .bundle()
      // log errors if they happen
      .on('error', gutil.log.bind(gutil, 'Browserify Error'))
      .pipe(source('bundle.js'))
      // optional, remove if you don't need to buffer file contents
      .pipe(buffer())
      // optional, remove if you dont want sourcemaps
      .pipe(sourcemaps.init({ loadMaps: true })) // loads map from browserify file
         // Add transformation tasks to the pipeline here.
      .pipe(sourcemaps.write('./')) // writes .map file
      .pipe(gulp.dest('./wwwroot/appscripts'));
}

gulp.task('scripts', function () {
    bundle();
});

