"use-strict"
var hbjs = require("handbrake-js"),
	chokidar = require("chokidar"),
	path = require("path"),
	fs = require("fs");

function SEU(path) {
	if (!(this instanceof SEU)) {
		throw new Error("SEU should be created with `new`")
	};
	console.log("Initiating in", path);
	this.paths = {
		dirs: {
			root: path,
			encode: `${path}/encode`,
			encoded: `${path}/encoded`,
			encoding: `${path}/encoding`,
			upload: `${path}/upload`,
			uploaded: `${path}/uploaded`,
			config: `${path}/config`
		},
		files: {
			config: `${path}/config/settings.json`
		}
	};
	Object.keys(this.paths.dirs).forEach(dir => {
		let p = this.paths.dirs[dir];
		if (!fs.existsSync(p)){
			fs.mkdir(p, err => {
				if(err){
					throw err;
				}
			});
		}
	});
	this.createConfig(this.paths.files.config);
}

SEU.prototype.createConfig = function(filePath){
	var settings = {
		extension: "mp4",
		options: {
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
		}
	};
	if (!fs.existsSync(filePath)){
		fs.writeFile(filePath, JSON.stringify(settings), err => {
			if(err) {
				throw err;
			}
		});
		console.log(`Config file created in ${filePath}\n please modify according to the settings you want and run again.`);
		process.exit();
	}
}

SEU.prototype.loadConfig = function(filePath){
	fs.readFile(filePath, 'utf8', (err, data) => {
		if (err) throw err;
		this.settings = JSON.parse(data);
	});
}

SEU.prototype.Watch = function(){
	console.log("Started.");
	this.encode = chokidar.watch(this.paths.dirs.encode, { ignored: /[\/\\]\./, persistent: true });
	this.upload = chokidar.watch(this.paths.dirs.upload, { ignored: /[\/\\]\./, persistent: true });
	this.config = chokidar.watch(this.paths.files.config, { ignored: /[\/\\]\./, persistent: true });
	this.encode.on('add', filePath => {
		this.Encode(filePath);
	});
	this.upload.on('add', filePath => {
		this.Upload(filePath);
	});
	this.config.on('add', filePath => {
		this.loadConfig(filePath);
	}).on('modify', filePath => {
		this.loadConfig(filePath);
	});
}

SEU.prototype.Encode = function(filePath){
	var p = path.parse(filePath);
	var options = {
		input: filePath,
		output: path.normalize(`${this.paths.dirs.encoding}/${p.name}.${this.settings.extension}`),
	}
	options = Object.assign(options, this.settings.options);
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
			fs.rename(options.input, path.normalize(`${this.paths.dirs.encoded}/${p.base}`), err => {
				if(err) throw err;
			});
			var p = path.parse(options.output);
			fs.rename(options.output, path.normalize(`${this.paths.dirs.upload}/${p.base}`), err => {
				if(err) throw err;
			});
		});
}

SEU.prototype.Upload = function(filePath){
	console.log("%s, is ready for upload.", filePath);
	// TODO upload api stuff
}

module.exports = SEU;
