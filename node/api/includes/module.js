"use strict";
exports = module.exports = function(server){
var childProcess = require('child_process');
var dir ="./";
var listScript = [];

/**
 * @api {get} /module/:id GetListModule
 * @apiName GetListModule
 * @apiGroup Module
  * @apiParam {String} id Un identifiant unique correspondant au module.
 */
server.get('/module/:id', function (req, res, next) {
    try {
		if( req.params['id'] == 0 )
            throw "InvalidParam";
		var id =req.params['id'];
        return res.send(listScript[id]);
    } catch ( err ) {
        return res.send(err);
    }
	next();
});
/**
 * @api {get} /module/ GetListModules
 * @apiName GetListModules
 * @apiGroup Module
 */
server.get('/module/', function (req, res, next) {
    try {
        return res.send(listScript);
    } catch ( err ) {
        return res.send(err);
    }
	next();
});
/**
 * @api {set} /module/manage/start/:id LaunchModule
 * @apiName LaunchModule
 * @apiGroup Module
 * @apiParam {String} id Un identifiant unique correspondant au module.
 */
server.get('/module/manage/start/:id', function (req, res, next) {
	try {
		if( req.params['id'] == 0 )
            throw "InvalidParam";
		var id =req.params['id'];
		listScript[id]["process"]  = runScript(dir + id, function (err) {
			if (err) console.log(err);			
		});
		listScript[id]["state"] = "start";
	} catch ( err ) {
        return res.send(err);
    }
	next();
});
/**
 * @api {set} /module/manage/start/ LaunchModules
 * @apiName LaunchModules
 * @apiGroup Module
 */
server.get('/module/manage/start/', function (req, res, next) {
	try {
        listScript.forEach(function(file) {
			listScript[file]["process"]  = runScript(dir + file, function (err) {
				if (err) console.log(err);			
			});
			listScript[file]["state"] = "start";
		});
    } catch ( err ) {
        return res.send(err);
    }
	next();
});
/**
 * @api {set} /module/manage/stop/:id StopModule
 * @apiName LaunchModule
 * @apiGroup Module
 * @apiParam {String} id Un identifiant unique correspondant au module.
 */
server.get('/module/manage/stop/:id', function (req, res, next) {
	try {
		if( req.params['id'] == 0 )
            throw "InvalidParam";
		var id =req.params['id'];
		var spawn = childProcess.spawn("kill "+ listScript[id]["process"].pid);
		listScript[id]["state"] = "stop";
	} catch ( err ) {
        return res.send(err);
    }
	next();
});
/**
 * @api {set} /module/manage/stop/ StopModules
 * @apiName LaunchModules
 * @apiGroup Module
 */
server.get('/module/manage/stop/', function (req, res, next) {
	try {
        listScript.forEach(function(file) {
			var spawn = childProcess.spawn("kill "+ listScript[file]["process"].pid);
			listScript[file]["state"] = "stop";
		});
    } catch ( err ) {
        return res.send(err);
    }
	next();
});

init();
function init() {
	var list = getScript();
	list.forEach(function(file) {
		listScript[file]={};
		listScript[file]["state"] = "stop";
		listScript[file]["file"] = file;
		listScript[file]["process"] = null;
	});
	console.log(listScript);
}
function getScript(){
	var fs = fs || require('fs'),
	files = fs.readdirSync(dir);
	filelist = [];
	files.forEach(function(file) {
		if (fs.statSync(dir + '/' + file).isDirectory()) {
		
		}
		else {
			if(getExtension(file) == ".js")
				filelist.push(file);
		}
	});
	return filelist;
}
function getExtension(filename) {
    var i = filename.lastIndexOf('.');
    return (i < 0) ? '' : filename.substr(i);
}
function runScript(scriptPath, callback) {
    var invoked = false;
    var process = childProcess.fork(scriptPath);
    process.on('error', function (err) {
        if (invoked) return;
        invoked = true;
        callback(err);
    });
    process.on('exit', function (code) {
        if (invoked) return;
        invoked = true;
        var err = code === 0 ? null : new Error('exit code ' + code);
		
        callback(err);
    });
	return process;
}

};
