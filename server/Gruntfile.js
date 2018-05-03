module.exports = function (grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		ts : {
			options : {
				noImplicitAny: true,
				target: 'es5',
				comments: false,
				allowUnreachableCode: false,
				allowUnusedLabels: false,
				decleration: false,
				sourceMap: false,
				rootDir: "src"
			},
			regular : {
				src: [
					'src/**/*.ts'
				],
				outDir: 'dist'
			}
		},
		watch : {
			project: {
				files: ['src/**/*.ts'],
				tasks: ['ts', 'tslint']
			}
		},
		jshint : {
			all : [
				'Gruntfile.js'
			]
		},
		tslint : {
			options: {
				configuration: "./tslint.json",
				force: false,
				fix: false
			},
			files : {
				src: [
					"src/**/*.ts"
				]
			}
		},
		run : {
			jest : {
				cmd: 'jest',
				args: [
					'--coverage'
				]
			}
		}
	});

	grunt.loadNpmTasks('grunt-run');
	grunt.loadNpmTasks('grunt-ts');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-tslint');

	grunt.registerTask('compile', ['ts:regular']);
	grunt.registerTask('develop', ['watch']);
	grunt.registerTask('test', ['jshint', 'tslint', 'run:jest']);
	grunt.registerTask('default', ['compile', 'test']);
};