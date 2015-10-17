
var Fuzzer = function(ctx){
	this.context = ctx;
	this.rate = 0;
	this.dirty = false;//for rate==0 only
	this.width = ctx.canvas.width;
	this.height = ctx.canvas.height;
	this.lastDrawTime = 0;
	return this;
}

Fuzzer.prototype = {
	setRate: function(rate){
		this.rate = rate;
		if(rate == 0)
			this.dirty = true;
		this.lastDrawTime = performance.now();
	},
	setText: function(text){
		this.words = text.match(/((?:\w+[,.:;]?\s+){5})/g);
		this.wordsIndex = 0;
	},
	getPhrase: function(){
		return this.words[this.wordsIndex];
	},
	nextPhrase: function(){
		this.wordsIndex = Math.floor(Math.random() * this.words.length);
	},
	tickFrame: function(time){
		if((this.rate == 0 || time - this.lastDrawTime <= 1000/this.rate) && !this.dirty){
			return;	
		}
		var stat = (time - this.lastDrawTime)/(1000/this.rate) - 1;
		this.lastDrawTime = time;	
		this.drawFrame(stat);
	},
	drawFrame: function(stat){
		var fuzzBuffer = this.getFuzz(this.width, this.height);
		var array = new Uint8ClampedArray(fuzzBuffer);
		var img = new ImageData(array, this.width, this.height);
		this.context.putImageData(img, 0, 0);
		this.context.fillText(this.getPhrase(), this.width/2, this.height/2, this.width);
		if(stat >= 1)
			this.context.fillStyle = "red";
		else if(stat >= .7)
			this.context.fillStyle = "yellow";
		else
			this.context.fillStyle = "green";
		this.context.fillRect(0,0,15,15);
		this.context.fillStyle = "black";
		this.dirty = false;
	},
	getFuzz: function(width, height){
		var img = new ArrayBuffer(width*height*4);
		var view = new Uint32Array(img);
		for(var i = 0;i < width*height;++i){
			view[i] = Math.random() < 0.5?0xFF000000:0xFFFFFFFF;
		}
		return img;
	}
}
var Explainer = function(context){
	this.context = context;
	this.dirty = true;
	return this;
}
Explainer.prototype = {
	tickFrame: function(time){
		if(!this.dirty)
			return;
		this.drawFrame();
	},
	drawFrame: function(){
		this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
		var lines = this.splitText(this.text);
		for(i in lines){
			this.context.fillText(lines[i], this.context.canvas.width/2, i*64 + 32, this.context.canvas.width);
		}
		this.dirty = false;
	},
	splitText: function(text){
		return text.split("\n");
	},
	setText: function(str){
		this.text = str;
		this.dirty = true;
	}
}
var Experiment = function(canvas){
	this.canvas = canvas;
	this.context = canvas.getContext("2d");
	this.context.font = "30px serif";
	this.context.textAlign = "center";
	window.results = {0:[], 7:[], 15:[], 30:[]};
	this.fuzzer = new Fuzzer(this.context);
	this.fuzzer.setText(text);
	this.explainer = new Explainer(this.context);
	this.explainer.setText("Click to be presented with text.\nClick again when you know what is said");
	this.isExplainer = true;
	this.drawer = this.explainer;
	var par = this;
	this.canvas.addEventListener("click", function(){
		par.onClick();
	});
	return this;
}
Experiment.prototype = {
	onClick: function(){
		if(this.isExplainer){
			this.drawer = this.fuzzer;
			var rates = [0,7,15,30];
			this.rate = rates[Math.floor(Math.random() * rates.length)];
			this.fuzzer.setRate(this.rate);
			this.fuzzer.nextPhrase();
			this.start = performance.now();
		}
		else{
			var time = performance.now() - this.start;
			window.results[this.rate].push(time);
			this.drawer = this.explainer;
			this.explainer.dirty = true;
		}
		this.isExplainer = !this.isExplainer;
	},
	tickFrame(time){
		this.drawer.tickFrame(time);
		window.requestAnimationFrame(this.tickFrame.bind(this));
	}
}

document.addEventListener("DOMContentLoaded", function(){
	var exp = new Experiment(document.getElementById("canvas"));
	exp.tickFrame(0);
});
