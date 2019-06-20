"use strict"

const fs = require('fs');
const ray = require('./ray.js');

const resolution = 100;

calcPhiSum(true);
calcPhiSum(false);

function calcPhiSum(inside) {
	var filename = 'data/phisum_'+inside+'.json';
	console.log('generate '+filename);

	if (fs.existsSync(filename)) {
		console.log('   ignore');
		return;
	}

	var data = []
	for (var xi = 0; xi <= resolution; xi++) {
		if (xi % 5 === 0) console.log('   '+(100*xi/resolution).toFixed(1)+'%');
		data[xi] = [];
		for (var yi = 0; yi <= resolution; yi++) {
			var x = xi/resolution;
			var y = yi/resolution;
			var v = ray.getTanhPhiSum(x,y,inside,1e-4);
			data[xi][yi] = v;
		}
	}

	fs.writeFileSync(filename, JSON.stringify(data), 'utf8');
}
