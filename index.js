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

var Q = require("q");
var fs = require("fs");
var request = require("request");
var parse = require('playlist-parser').M3U.parse
var spawn = require('child_process').spawn

var log, host, port, url, prc;

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

exports.init = function(_log, config) {
	var deferred = Q.defer();
	log = _log;
	host = config.proxy.host;
	port = config.proxy.port;
	url = 'http://' + host + ':' + port
	prc = spawn('GMusicProxy', ['-e '+config.proxy.login, '-p '+config.proxy.password, '-d '+config.proxy.device_id, '-H '+config.proxy.host, '-P '+config.proxy.port]);
	deferred.resolve();
	return deferred.promise;
}

exports.search = function(max_results, query) {
	var deferred = Q.defer();

	request.get(url+'/get_by_search?type=artist&num_tracks='+max_results+'&artist='+query, function(error, response, body) {
		if(error) {
			deferred.reject(error);
			return;
		}
		log.debug(body)
		var res = parse(body).filter(not_null).map(format_result);
		deferred.resolve(res);
	});

	return deferred.promise;
}

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
}
