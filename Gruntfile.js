module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.initConfig({
        jshint: {
            all: ['Gruntfile.js', 'src/**/*.js']
        },
        watch: {
            files: ['src/**/*.js'],
            tasks: ['jshint']
        },
        uglify : {
            build : {
                src : ["src/lively.js"],
                dest : "dist/lively.min.js"
            }
        }
    });

    grunt.registerTask('build', ["uglify"]);
};