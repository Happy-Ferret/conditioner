module.exports = function(grunt) {

	grunt.initConfig({
		pkg:grunt.file.readJSON('package.json'),
		path:{
			src:'./src',
			spec:'./spec',
			conditioner:'<%= path.src %>/conditioner',
			wrapper:'<%= path.src %>/wrapper',
			tests:'<%= path.src %>/tests',
			utils:'<%= path.src %>/utils'
		},
		meta:{
			banner:'// <%= pkg.name %> v<%= pkg.version %> - <%= pkg.description %>\n' +
				   '// Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %> - <%= pkg.homepage %>\n' +
				   '// License: <%= _.map(pkg.licenses, function(x) {return x.type + " (" + x.url + ")";}).join(", ") %>\n'
		},
		jasmine:{
			src:[
                '<%= path.conditioner %>/UnaryExpression.js',
                '<%= path.conditioner %>/BinaryExpression.js',
                '<%= path.conditioner %>/ExpressionFormatter.js',
                '<%= path.conditioner %>/TestFactory.js',
                '<%= path.conditioner %>/Tester.js',
                '<%= path.conditioner %>/ModuleRegistry.js',
                '<%= path.conditioner %>/ModuleController.js',
                '<%= path.conditioner %>/NodeController.js',
                '<%= path.conditioner %>/SyncedControllerGroup.js',
                '<%= path.conditioner %>/StaticModuleAgent.js',
                '<%= path.conditioner %>/ConditionModuleAgent.js',
                '<%= path.conditioner %>/ModuleLoader.js'
            ],
			options:{
                keepRunner:true,
				specs:'<%= path.spec %>/*.js',
				helpers:[
					'<%= path.spec %>/shim/Function.bind.js'
				],
				template:require('grunt-template-jasmine-requirejs'),
				templateOptions:{
					requireConfig:{
                        paths:{
                            'src/conditioner':'../src/conditioner',
                            'utils':'../src/utils'
                        },
                        map:{
                            '*':{
                                'conditioner/extendClass':'../src/utils/extendClass',
                                'conditioner/mergeObjects':'../src/utils/mergeObjects',
                                'conditioner/Observer':'../src/utils/observer'
                            }
                        },
						baseUrl:'./spec/',
						callback: function() {
							require(
                                    ['utils/Observer',
                                     'utils/contains',
                                     'utils/matchesSelector',
                                     'utils/mergeObjects',
                                     'utils/extendClass'],function(Observer,contains,matchesSelector,mergeObjects,extendClass) {
								window['Observer'] = Observer;
								window['contains'] = contains;
								window['matchesSelector'] = matchesSelector;
								window['mergeObjects'] = mergeObjects;
                                window['extendClass'] = extendClass;
							});
						}
					}
				}
			}
		},
		concat:{
			dist:{
				options: {
					banner:'<%= meta.banner %>',
					process:function(src,path){

						// the following code could probably be improved
						if (path.indexOf('wrapper/') === -1) {

							// add tab on first line
							src = '\t' + src;

							// add tabs on other lines
							src = src.replace(/(\n)+/g,function(match) {
								return match + '\t';
							});

						}
						return src;
					}

				},
				src:[
					'<%= path.wrapper %>/intro.js',

					'<%= path.conditioner %>/UnaryExpression.js',
					'<%= path.conditioner %>/BinaryExpression.js',
					'<%= path.conditioner %>/ExpressionFormatter.js',
					'<%= path.conditioner %>/TestFactory.js',
					'<%= path.conditioner %>/Tester.js',
                    '<%= path.conditioner %>/ModuleRegistry.js',
					'<%= path.conditioner %>/ModuleController.js',
					'<%= path.conditioner %>/NodeController.js',
                    '<%= path.conditioner %>/SyncedControllerGroup.js',
                    '<%= path.conditioner %>/StaticModuleAgent.js',
                    '<%= path.conditioner %>/ConditionModuleAgent.js',
					'<%= path.conditioner %>/ModuleLoader.js',

					'<%= path.wrapper %>/outro.js'
				],
				dest:'dist/<%= pkg.name %>.js'
			}
		},
		copy:{
			tests:{
				expand:true,
				cwd:'<%= path.tests %>',
				src:'*',
				dest:'./dist/tests/'
			},
			utils:{
				expand:true,
				cwd:'<%= path.utils %>',
				src:'*',
				dest:'./dist/conditioner/'
			}
		},
		requirejs:{
			compile:{
				options:{
					optimize:'none',
					baseUrl:'./dist',
					name:'<%= pkg.name %>',
					out:'./dist/conditioner-<%= pkg.version %>.js',
					preserveLicenseComments:false,
					useSourceUrl:false,
					include:[
						'conditioner/Observer',
						'conditioner/contains',
						'conditioner/matchesSelector',
						'conditioner/mergeObjects',
                        'conditioner/extendClass'
					]
				}
			}
		},
		clean:[
			'./dist/conditioner',
			'./dist/conditioner.js'
		],
		uglify: {
			tests: {
				expand: true,
				src:'*',
				dest:'./dist/tests.min/',
				cwd:'<%= copy.tests.dest %>'
			},
			lib: {
				options: {
					banner:'<%= meta.banner %>',
					report:'gzip'
				},
				src:'<%= requirejs.compile.options.out %>',
				dest:'./dist/<%= pkg.name %>-<%= pkg.version %>.min.js'
			}
		},
		jshint:{
			options:{
				jshintrc:'.jshintrc'
			},
			all:[
				'<%=concat.dist.dest %>',
				'<%=path.src %>/tests/*.js'
			]
		},
		watch: {
			files:['<%= path.src %>/**/*.js','<%= path.spec %>/*.js'],
			tasks:'test'
		}

	});

	// load tasks
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-jasmine');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-clean');

	// test
	grunt.registerTask('test',['jshint','jasmine']);

	// build
	grunt.registerTask('lib',['concat','copy','requirejs','clean','uglify']);

	// build than test
	grunt.registerTask('dev',['lib','test','watch']);

};