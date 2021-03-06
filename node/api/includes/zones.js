"use strict";
exports = module.exports = function(server){
  var ERR = require('node-restify-errors');
  var moment = require('moment');
  // bla, bla, bla... à déplacer
  // Compression algorithm
  function lzw_encode(s) {
    var dict = {};
    var data = (s + "").split("");
    var out = [];
    var currChar;
    var phrase = data[0];
    var code = 256;
    for (var i=1; i<data.length; i++) {
        currChar=data[i];
        if (dict[phrase + currChar] != null) {
            phrase += currChar;
        }
        else {
            out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
            dict[phrase + currChar] = code;
            code++;
            phrase=currChar;
        }
    }
    out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
    for (var i=0; i<out.length; i++) {
        out[i] = String.fromCharCode(out[i]);
    }
    return out.join("");
}

/**
 * @api {get} /zone/:id GetZoneById
 * @apiName GetZoneById
 * @apiGroup Zone
 * @apiParam {Integer} id Un identifiant unique correspondant à la zone.
 */
server.get('/zone/:id', function (req, res, next) {
  if( req.params['id'] == 0 )
    return res.send(new ERR.BadRequestError("InvalidParam"));

  server.conn.query("SELECT * FROM `rp_location_zones` WHERE `id`=?", [req.params['id']], function(err, rows) {
    if( rows.length == 0 ) return res.send(new ERR.NotFoundError("ZoneNotFound"));

    var obj = new Object();
    obj.nom = rows[0].zone_name;
    obj.type = rows[0].zone_type;
    obj.min = new Array(rows[0].min_x, rows[0].min_y, rows[0].min_z);
    obj.max = new Array(rows[0].max_x, rows[0].max_y, rows[0].max_z);

    return res.send(obj);
	});
	next();
});
server.get('/zones', function (req, res, next) {
  if( req.params['id'] == 0 )
    return res.send(new ERR.BadRequestError("InvalidParam"));

  var expire = moment({hour: 6}).toDate();
  if( req.headers['if-none-match'] == expire.getTime() ) { return res.send(304); }
  res.header('ETag', expire.getTime());

  var cache = server.cache.get( req._url.pathname);
  if( cache != undefined ) {  return res.send(cache); }

  server.conn.query("SELECT *, SUBSTRING(`job_name`, LOCATE(' - ', `job_name`)+3) as `job_name`, SUBSTRING(`zone_name`, LOCATE(': ', `zone_name`)+1) as `zone_name` FROM `rp_location_zones` Z LEFT JOIN `rp_jobs` J ON J.`job_id`=Z.`zone_type`  GROUP BY `min_x`, `min_y`, `max_x`, `max_y`", [req.params['id']], function(err, rows) {
    if( rows.length == 0 ) return res.send(new ERR.NotFoundError("ZoneNotFound"));

    var array = new Array();

    for(var i=0; i<rows.length; i++) {
      var obj = new Object();
      obj.type = rows[i].zone_type;
      obj.name = rows[i].zone_name.trim();
      if( rows[i].job_name == "ns emploi" )
        rows[i].job_name = "";
      obj.owner = rows[i].job_name.trim();
      obj.private = rows[i].private;

      obj.min = new Array(rows[i].min_x, rows[i].min_y/*, rows[i].min_z*/);
      obj.max = new Array(rows[i].max_x, rows[i].max_y/*, rows[i].max_z*/);
      array.push(obj);
    }

    var data = lzw_encode( JSON.stringify(array) );
    server.cache.set( req._url.pathname, data, 3600);
    return res.send(data);
	});
	next();
});

};
