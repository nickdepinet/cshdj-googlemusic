/*
 * A GMusicProxy plugin for CSH DJ.
 * This allows Google Music (even All Access!) to be used as a song source.
 * This requires the use of a separate GMusicProxy server (now included!).
 *
 * Configuration: 
 *  proxy: {
 *    host: "your_gmusicproxy_host",
 *    port: "your_gmusicproxy_port",
 *    login: "your_google_music_email",
 *    password: "your_google_password",
 *    device_id: "a_valid_android_device_id" 
 * }
 * 
 */
/*jshint es5: true */

var Q = require("q");
var fs = require("fs");
var request = require("request");
var parse = require('playlist-parser').M3U.parse;
var spawn = require('child_process').spawn;

var log, host, port, url, prc, random_serach_interval;

exports.display_name = "Google Music";

function format_result(result) {
	return {
		id: result.file.split("=").slice(-1)[0],
		title: result.title,
		artist: result.artist,
	};
}

function not_null(item) {
	return  typeof item != "undefined";
}

function performRandomSearch() {
  var terms = [
    'astley', 'black keys', 'brothers', 'mine', 'orange',
    'neon', 'yeasayer', 'master', 'lonely', 'boy',
    'attack', 'camino', 'girl', 'arctic', 'monkeys',
    'magic', 'fitz', 'night', 'daft', 'punk',
    'release', 'got', 'alive', 'dead' ];
  var query = terms[Math.floor(Math.random() * terms.length)];
  exports.search(5, query)
  .done(function(results) {
    var count = results ? results.length : 0;
    log('Performed random search for "' + query + '", got ' + count + ' results');
  }, function(err) {
    log.warn('Failed periodic random search for "' + query + '": ' + err.stack || err);
  });
}

exports.init = function(_log, config) {
	var deferred = Q.defer();
	log = _log;
	host = config.proxy.host;
	port = config.proxy.port;
	url = 'http://' + host + ':' + port;
	prc = spawn('GMusicProxy', ['-e '+config.proxy.login, '-p '+config.proxy.password, '-d '+config.proxy.device_id, '-H '+config.proxy.host, '-P '+config.proxy.port]);
  random_search_interval = config.random_search_interval || 10;
	deferred.resolve();
  
  if (random_search_interval) {
    // Every 10 minutes, make a random search to keep authentication alive.
    setInterval(performRandomSearch, random_search_interval * 60 * 1000);

    // Perform first search after a moment.
    setTimeout(performRandomSearch, 10 * 1000);
  }

	return deferred.promise;
};

exports.search = function(max_results, query) {
	var deferred = Q.defer();

	request.get(url+'/get_by_search?type=songs&num_tracks='+max_results+'&title='+query, function(error, response, body) {
		if(error) {
			deferred.reject(error);
			return;
		}
		log.debug(body);
		var res = parse(body).filter(not_null).map(format_result);
		deferred.resolve(res);
	});

	return deferred.promise;
};

exports.fetch = function(id, download_location) {
	var deferred = Q.defer();

	var download_path = download_location + id + ".mp3";
	var ws = fs.createWriteStream(download_path);

	var opts = {
		uri : url+'/get_song?id='+id,
		method : "GET",
		encoding : null
	};
	request(opts, function(error, response, songdata) {
		if(error) {
			deferred.reject(error);
			return;
		}
		ws.write(songdata);
		deferred.resolve(download_path);
	});
	return deferred.promise;
};

