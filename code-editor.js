/* eslint-disable indent */
var path = require('path');
var fs = require('fs');

module.exports = function(RED) {

	var count = 0;

	function HTML(config) {
		count++;
		
		var id = "ui-code-editor-" + count;
		var filename = (config.filename && config.filename !== "") ? config.filename : "not-set";
		var textOfFile = "";

		if (filename !== "" && filename !== "not-set") {
			if (!fs.existsSync(filename)) {
				filename = "not-set";
			} else {
				fs.readFile(filename, 'utf8', function (err, file) {
					if (err) { textOfFile = "Error leyendo el archivo."; }
					else { textOfFile = file; }
				});
			}
		}

		var html = String.raw`
			<div id="${id}"></div>
				
			<script src="ui-code-editor/src-min-noconflict/ace.js" type="text/javascript" charset="utf-8"></script>
			<script>
				(function(scope) {
					scope.$watch("msg", function(msg) {
						var filename = 'not-set';
						filename = (msg && msg.filename) ? msg.filename : '${filename}';					

						if (filename === 'not-set' || filename === '') { return; }

						$("#${id}").html("${textOfFile}");
					});
				})(scope);
			</script>
			<script>
				var editor = ace.edit("${id}");
				editor.setTheme("ace/theme/monokai");
				editor.session.setMode("ace/mode/javascript");
			</script>
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

					initController: function($scope, events) {
						$scope.flag = true;   // not sure if this is needed?

						$scope.init = function (config) {
							$scope.config = config;
						};	

						
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