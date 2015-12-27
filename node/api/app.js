var restify = require('restify');
var redirect = require('restify-redirect');

var fs=require("fs");
var mysql = require('mysql2');
var NodeCache = require( "node-cache" );


var server = restify.createServer({key: fs.readFileSync("../www.ts-x.eu.key"), certificate: fs.readFileSync("../www.ts-x.eu.crt"), ca: fs.readFileSync('../intermediate.crt') });
require('./auth.js')(server);

server.conn = mysql.createConnection(server.sqlConfig);
server.conn.connect();
server.conn.query("SET NAMES 'utf8'");
server.cache = new NodeCache({ stdTTL: 30, checkperiod: 60 });
server.restify = restify;
server.restify.CORS.ALLOW_HEADERS.push('origin');
server.restify.CORS.ALLOW_HEADERS.push('auth');


function handleDisconnect() {
    server.conn = mysql.createConnection(server.sqlConfig);
    server.conn.connect( function(err) {
        if( err ) {
            console.log("DATABASE ERROR: Cannot connect to database");
            setTimeout(handleDisconnect, 5000);
        }
    });
    server.conn.query("SET NAMES 'utf8'");

    server.conn.on('error', function(err) {
        console.log("DATABASE ERROR: "+err);
        handleDisconnect();
    });
}
handleDisconnect();

process.on('uncaughtException', function(err) {
	console.log('Caught exception: ' + err);
	handleDisconnect();
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(restify.CORS());
server.use(restify.fullResponse());
server.use(restify.conditionalRequest());
server.use(redirect());




require('./includes/module.js')(server);
require('./includes/user.js')(server);
require('./includes/report.js')(server);
require('./includes/items.js')(server);
require('./includes/zones.js')(server);
require('./includes/proxy.js')(server);
require('./includes/panel.js')(server);
require('./includes/job.js')(server);
require('./includes/group.js')(server);
require('./includes/live.js')(server);
require('./includes/forum.js')(server);
require('./includes/rank.js')(server);
require('./includes/connection.js')(server);

server.get('/', function (req, res, next) {
  return res.redirect('https://www.ts-x.eu/node/apidoc/');
});

server.listen(8080, "37.59.68.185", function () {
	console.log('%s listening at %s', server.name, server.url);
});
