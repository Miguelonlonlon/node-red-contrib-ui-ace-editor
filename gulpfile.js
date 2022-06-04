
var
    gulp = require("gulp")

function files() {
    //return gulp.src('node_modules/font-awesome/fonts/*').pipe(gulp.dest('dist/fonts/'));
    //gulp.src('node_modules/ace-builds/src-min-noconflict').pipe(gulp.dest('lib/ace/'));
    gulp.src('node_modules/ace-builds/src-min-noconflict/*').pipe(gulp.dest('lib/ace/src-min-noconflict/'));
    //gulp.src('node_modules/ace-builds/css').pipe(gulp.dest('lib/ace/'));
    return gulp.src('node_modules/ace-builds/css/*').pipe(gulp.dest('lib/ace/css/'));
}

exports.default = gulp.series(files);
// need to add back in css.
