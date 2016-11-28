"use-strict"
var hbjs = require("handbrake-js"),
	chokidar = require("chokidar"),
	path = require("path"),
	fs = require("fs");

function SEU(path) {
	console.log("Initiating in", path);
	this.paths = {
		encode: `${path}/encode`,
		encoded: `${path}/encoded`,
		encoding: `${path}/encoding`,
		upload: `${path}/upload`,
		uploaded: `${path}/uploaded`
	};
	Object.keys(this.paths).forEach(dir => {
		let p = this.paths[dir];
		if (!fs.existsSync(p)){
			fs.mkdirSync(p);
		}
	});
	this.Watch();
}

SEU.prototype.Watch = function(){
	console.log("Started.");
	this.encode = chokidar.watch(this.paths.encode, { ignored: /[\/\\]\./, persistent: true });
	this.upload = chokidar.watch(this.paths.upload, { ignored: /[\/\\]\./, persistent: true });
	this.encode.on('add', filePath => {
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
		this.Encode(options);
	});
	this.upload.on('add', filePath => {
		this.Upload(filePath);
	});
}

SEU.prototype.Encode = function(options){
	console.log("Settings Used:", options);
	hbjs.spawn(options)
		.on("output", (stdout, stderr) => {
			// some shit
		})
		.on("error", err => {
			throw err;
			// invalid user input, no video found etc
		})
		.on("progress", progress => {
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
		.on("complete", () => {
			try{
				//process.stdout.clearLine();
				//process.stdout.cursorTo(0);
				process.stdout.write("\n");
			}catch(e){
				// Fuck you pm2
			}
			var p = path.parse(options.input);
			fs.rename(options.input, path.normalize(`${this.paths.encoded}/${p.base}`), err => {
				if(err) throw err;
			});
			var p = path.parse(options.output);
			fs.rename(options.output, path.normalize(`${this.paths.upload}/${p.base}`), err => {
				if(err) throw err;
			});
		});
}

SEU.prototype.Upload = function(filePath){
	console.log("%s, is ready for upload.", filePath);
	// TODO upload api stuff
}

module.exports = exports = SEU;
