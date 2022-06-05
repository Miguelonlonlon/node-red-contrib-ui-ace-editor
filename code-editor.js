/* eslint-disable indent */
var path = require('path');
var fs = require('fs');

module.exports = function(RED) {

	var count = 0;
	var editor;
	
	function HTML(config) {
		count++;
		
		var id = "ui-" + count;

		var html = String.raw`
			<div id='ui_code-editor-{{$id}}'>{{ textOfFile }}</div>
				
			<script src="ui-code-editor/src-min-noconflict/ace.js" type="text/javascript" charset="utf-8"></script>
			<!--script>
				var editor = ace.edit("${id}");
				editor.setTheme("ace/theme/monokai");
				editor.session.setMode("ace/mode/javascript");
			</script-->
		`;
		return html;
	}

	function checkConfig(node, conf) {
		if (!conf || !conf.hasOwnProperty("group")) {
			node.error(RED._("ui_code_editor.error.no-group"));
			return false;
		}
		if (conf.hasOwnProperty("filename")) {
			if (conf.filename === "")
				return true;
			if (!fs.existsSync(conf.filename)) {
				node.error(RED._("ui_code_editor.error.filename-not-exists"));
				return false;
			}
		}
		return true;
	}

	var ui = undefined;

	function codeEditorNode(config) {
		try {
			var node = this;
			if(ui === undefined) {
				ui = RED.require("node-red-dashboard")(RED);
			}
			RED.nodes.createNode(this, config);

			if (checkConfig(node, config)) {
				var html = HTML(config);                    // *REQUIRED* !!DO NOT EDIT!!
				var done = ui.addWidget({                   // *REQUIRED* !!DO NOT EDIT!!
					node: node,                             // *REQUIRED* !!DO NOT EDIT!!
					order: config.order,                    // *REQUIRED* !!DO NOT EDIT!!
					group: config.group,                    // *REQUIRED* !!DO NOT EDIT!!
					width: config.width,                    // *REQUIRED* !!DO NOT EDIT!!
					height: config.height,                  // *REQUIRED* !!DO NOT EDIT!!
					format: html,                           // *REQUIRED* !!DO NOT EDIT!!
					templateScope: "local",                 // *REQUIRED* !!DO NOT EDIT!!
					emitOnlyNewValues: false,               // *REQUIRED* Edit this if you would like your node to only emit new values.
					forwardInputMessages: false,            // *REQUIRED* Edit this if you would like your node to forward the input message to it's ouput.
					storeFrontEndInputAsState: true,       // *REQUIRED* If the widgect accepts user input - should it update the backend stored state ?

					beforeEmit: function(msg, value) {
						return { msg: msg };
					},

					beforeSend: function (msg, orig) {
						if (orig) {
							return orig.msg;
						}
					},
					//initController: $scope => $scope.$watch( 'msg.filename', f => {
					initController: function ($scope, events) {
						$scope.inited = false;
						$scope.textOfFile = "";
						var codeeditordiv;

						var createCodeEditor = function(basefile) {
							codeeditordiv = '#ui_code-editor-' + $scope.$eval('$id')
                            if (basefile !== "" && basefile !== "not-set") {
								if (!fs.existsSync(basefile)) {
									$scope.textOfFile = "No existe el archivo.";
								} else {
									fs.readFile(basefile, 'utf8', function (err, file) {
										if (err) { $scope.textOfFile = "Error leyendo el archivo."; }
										else { $scope.textOfFile = file; }
									});
								}
							} else {
								$scope.textOfFile = "No se ha especificado el archivo.";
							}
							
							editor = ace.edit(codeeditordiv);
							editor.setTheme("ace/theme/monokai");
							editor.session.setMode("ace/mode/javascript");
                        };

                        $scope.init = function (config) {
                            $scope.config = config;
							var filename = "not-set";
							if (config.filename && config.filename !== "")
								filename = config.filename;
							
                            codeeditordiv = '#ui_code-editor-' + $scope.$eval('$id')
                            var stateCheck = setInterval(function() {
                                if (document.querySelector(codeeditordiv) && $scope.textOfFile) {
                                    clearInterval(stateCheck);
                                    $scope.inited = true;
                                    createCodeEditor(filename);
                                }
                            }, 40);
                        };
						
						$scope.$watch( 'msg.filename', basefile => {
                            createCodeEditor(basefile);
                        });
					//} )
					}
				});
			}
		}
		catch (e) {
			// eslint-disable-next-line no-console
			console.warn(e);		// catch any errors that may occur and display them in the web browsers console
		}

		node.on("close", function() {
			if (done) {
				done();
			}
		});
	}
	
	RED.nodes.registerType("ui_code_editor", codeEditorNode);
	
    var uipath = 'ui';
    if (RED.settings.ui) { uipath = RED.settings.ui.path; }
    var fullPath = path.join(RED.settings.httpNodeRoot, uipath, '/ui-code-editor/*').replace(/\\/g, '/');;
    RED.httpNode.get(fullPath, function (req, res) {
        var options = {
            root: __dirname + '/lib/ace/',
            dotfiles: 'deny'
        };
        res.sendFile(req.params[0], options)
    });
}