"use strict"

const fs = require('fs');

const resolution = 100;
const debug = 2;

var app1 = new approximator1();
var app2 = new approximator2();
var app3 = new approximator3();
//var app4 = new approximator4();

approximatePhiSum(
	approximatorPoly1([1.5,2,6]),
	false,//approximatorPoly([0,1,2]),
	true
);
//approximatePhiSum(app2, app2, false);

function approximatePhiSum(app1, app2, inside, par) {

	var filename = 'data/phisum_'+inside+'.json';
	if (!fs.existsSync(filename)) throw Error();

	var data0 = JSON.parse(fs.readFileSync(filename, 'utf8'));

	var parameters1D = [];
	var errorSum = 0;

	for (var xi = 0; xi <= resolution; xi++) {
		var row = data0[xi].map((v,yi) => [yi/resolution, v]);
		//console.log(data0[xi].join(','));

		var solution = solver1D(app1, row, par);
		parameters1D[xi] = solution.par;
		par = solution.par;
		errorSum += sqr(solution.error);
		if (debug > 0) {
			console.log([
				xi,
				solution.count,
				solution.error.toFixed(8),
				solution.par.map(v => v.toFixed(3)).join('\t')
			].join('\t'));
		}
	}

	if (!app2) {
		console.log(Math.sqrt(errorSum));
		process.exit();
	}

	var parameters2D = app1.init().map((v,i) => {
		var row = parameters1D.map((p,xi) => [xi/resolution, p[i]]);
		var solution = solver1D(app2, row);
		console.log(solution);
		return solution.par;
	})

	var data = [];
	data0.forEach((row, xi) => {
		row.forEach((v, yi) => data.push([xi/resolution, yi/resolution, v]));
	})

	//solver2D(app1, app2, data, parameters2D);

	console.log(parameters2D);
	process.exit();

	function solver1D(app, data, par0) {
		if (!par0) par0 = app.init();

		var step = 0.001;
		var count = 0;

		var grad = getGradient(par0);
		var newGrad = false;
		var bestError = getError(par0);

		if (debug > 2) {
			console.log(data);
			console.log(par0);
			console.log(grad);
		}

		while (true) {
			var par = grad.map((g,i) => par0[i] - step*grad[i]);
			if (app.fixPar) app.fixPar(par);
			var error = getError(par);
			count++;

			if (error < bestError) {
				bestError = error;
				par0 = par;
				step *= 1.1;
				newGrad = getGradient(par0);
				grad = newGrad.map((v,i) => v*0.1+0.9*grad[i]);
			} else {
				grad = newGrad;
				//grad = newGrad.map((v,i) => v*0.5+0.5*grad[i]);
				step /= 10;
			}


			if ((step < 1e-9) || (bestError < 1e-6)) {
				log();
				process.exit()
				return {
					par: par0,
					error: bestError,
					count: count,
				}
			}

			if (count % 1 === 0) log();

			function log() {
				if (debug <= 1) return;
				console.log([
					count,
					Math.log10(step).toFixed(2),
					Math.log10(bestError).toFixed(2), // -4.28
					par.map(v => v.toFixed(6)).join('\t')
				].join('\t'));
			}
		}
	
		throw Error();

		function getError(par) {
			var error = 0;
			data.forEach(e => {
				var x = e[0];
				var yGoal = e[1];
				var yIs = app.func(x, par);
				error += sqr(yIs-yGoal);
			})
			return Math.sqrt(error);
		}

		function getGradient(par) {
			var grad = app.initGrad();
			data.forEach(e => {
				var x = e[0];
				var yGoal = e[1];
				var yIs = app.func(x, par);
				app.grad(x, par).forEach((g,i) => {
					grad[i] += (yIs-yGoal)*g;
				})
			})
			return grad;
		}
	}
}


function approximator1() {
	return {
		init:     () => [0,0,0],
		initGrad: () => [0,0,0],
		func: (x, par) => (x*x*par[0] + x*(1-par[0]))/(x*x*par[1] + x*par[2] + (1-par[1]-par[2])),
		grad: (x, par) => {
			var a = x*x*par[0] + x*(1-par[0]);
			var b = x*x*par[1] + x*par[2] + (1-par[1]-par[2]);
			return [
				(x-1)*x/b,
				-a*(x*x-1)/sqr(b),
				-a*(x-1)/sqr(b),
			]
		},
	}
}

function approximator2() {
	return {
		init:     () => [0,0,1,0,0,1],
		initGrad: () => [0,0,0,0,0,0],
		func: (x, par) => (x*x*par[0] + x*par[1] + par[2])/(x*x*par[3] + x*par[4] + par[5]),
		grad: (x, par) => {
			var a = x*x*par[0] + x*par[1] + par[2];
			var b = x*x*par[3] + x*par[4] + par[5];
			return [
				x*x/b,
				x/b,
				1/b,
				-a*(x*x)/sqr(b),
				-a*x/sqr(b),
				-a*1/sqr(b),
			]
		},
		fixPar: par => {
			var s = Math.abs(par[0]) + Math.abs(par[1]) + Math.abs(par[2]);
			par.forEach((v,i) => par[i] /= s);
		}
	}
}


function approximator3() {
	return {
		init:     () => [0,0,1],
		initGrad: () => [0,0,0],
		func: (x, par) => x*x*x*x*par[0] + x*x*x*par[1] + x*x*par[2] + x*(1-par[0]-par[1]-par[2]),
		grad: x => {
			return [
				x*x*x*x - x,
				x*x*x - x,
				x*x - x,
			]
		},
	}
}

function approximatorPoly(exponents) {
	var length = exponents.length;
	var zeros = new Array(length);
	zeros.fill(0);
	return {
		init:     () => zeros.slice(),
		initGrad: () => zeros.slice(),
		func: (x, par) =>
			exponents.reduce((sum, e, i) => sum + Math.pow(x,e)*par[i], 0),
		grad: x => exponents.map(e => Math.pow(x,e)),
	}
}

function approximatorPoly1(exponents) {
	var length = exponents.length;
	var zeros = new Array(length);
	zeros.fill(0);
	return {
		init:     () => zeros.slice(),
		initGrad: () => zeros.slice(),
		func: (x, par) =>
			exponents.reduce((sum, e, i) => sum + Math.pow(x,e)*par[i], 0) +
			x*exponents.reduce((sum, e, i) => sum-par[i], 1),
		grad: x => exponents.map(e => Math.pow(x,e)-x),
	}
}


function sqr(v) { return v*v }
