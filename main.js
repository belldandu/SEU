"use-strict"
var hbjs = require("handbrake-js"),
	chokidar = require("chokidar"),
	path = require("path"),
	fs = require("fs");

function Watch() {
	this.paths = {
		encode: `${__dirname}/encode`,
		encoded: `${__dirname}/encoded`,
		encoding: `${__dirname}/encoding`,
		uploade: `${__dirname}/upload`,
		uploaded: `${__dirname}/uploaded`
	};
	self.Check(this.paths);
	this.encode = chokidar.watch(this.paths.encode, { ignored: /[\/\\]\./, persistent: true });
	this.upload = chokidar.watch(this.paths.upload, { ignored: /[\/\\]\./, persistent: true });
	var self = this;
	this.encode.on('add', function(filePath) {
		var p = path.parse(filePath);
		var options = {
			input: filePath,
			output: path.normalize(`${this.paths.encoding}/${p.name}.mp4`),
			encoder: "x264",
			"encoder-preset": "Slow",
			quality: 22,
			audio: 1,
			aencoder: "copy:aac",
			ab: "192",
			mixdown: "stereo",
			arate: "44.1",
			subtitle: "1",
			"subtitle-burned": 1,
			optimize: true
		};
		self.Encode(options);
	});
	this.upload.on('add', function(filePath) {
		self.Upload(filePath);
	});
}

Watch.prototype.Check = (paths) => {
	Object.values(paths).forEach(path => {
		if (!fs.existsSync(path)){
			fs.mkdirSync(path);
		}
	});
}

Watch.prototype.Encode = (options) => {
	console.log("Settings Used:", options);
	hbjs.spawn(options)
		.on("output", function(stdout, stderr){
			// some shit
		})
		.on("error", function(err){
			throw err;
			// invalid user input, no video found etc
		})
		.on("progress", function(progress){
			var log = `${progress.task}:`;
			switch(progress.task){
				case "Encoding":
					log = `${log} ${progress.taskNumber} of ${progress.taskCount}, ` +
					`${progress.percentComplete}% (${progress.fps} fps, avg ${progress.avgFps} fps,` +
					` ETA: ${progress.eta})`;
					break;
				case "Muxing":
					log = `${log} ${progress.percentComplete}%... This might take a while.`;
					break;
			}
			try{
				process.stdout.clearLine();
				process.stdout.cursorTo(0);
				process.stdout.write(log);
			}catch(e){
				// Fuck you pm2
				console.log(log);
			}
		})
		.on("complete", function(){
			try{
				//process.stdout.clearLine();
				//process.stdout.cursorTo(0);
				process.stdout.write("\n");
			}catch(e){
				// Fuck you pm2
			}
			var p = path.parse(options.input);
			fs.rename(options.input, path.normalize(p.dir+"/../encoded/"+p.base), function(err){
				if(err) throw err;
			});
			var p = path.parse(options.output);
			fs.rename(options.output, path.normalize(p.dir+"/../upload/"+p.base), function(err){
				if(err) throw err;
			});
		});
}

Watch.prototype.Upload = (filePath) => {
	console.log("%s, is ready for upload.", filePath);
	// TODO upload api stuff
}

exports.Watch = new Watch;
