"use strict"

const fs = require('fs');

const resolution = 100;
const debug = 2;

approximatePhiSum(
	approximatorPoly1([2,3,4,5,6]),
	approximatorPoly( [0,1,2,3,4]),
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

		var solution = solver1D(app1, row, par);
		parameters1D[xi] = solution.par;
		par = solution.par;
		errorSum += sqr(solution.error);
		if (debug > 0) {
			console.log([
				xi,
				solution.count,
				Math.log10(solution.error).toFixed(8),
				solution.par.map(v => v.toFixed(3)).join('\t')
			].join('\t'));
		}
		/*
		row.forEach(r => {
			console.log([
				r[0],
				r[1],
				app1.func(r[0], solution.par),
			].join('\t'))
		})
		*/
		//process.exit();
		
	}
	if (!app2) {
		console.log(Math.sqrt(errorSum));
		process.exit();
	}

	var parameters2D = app1.initX().map((v,i) => {
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

	function solver1D(app, data, x0) {
		if (!x0) x0 = app.initX();
		if (debug > 2) {
			console.log('x0', x0);
			console.log('error0', getError(x0));
			console.log('');
		}

		var count = 0;
		var stepSize = 1;

		var grad0 = getGradient(x0, -1);
		var s0 = grad0;
		var a0 = lineSearch(x0, grad0);
		var x1 = makeStep(x0, grad0, a0);
		
		if (debug > 2) {
			console.log('grad0', grad0);
			console.log('a0', a0);
			console.log('x1', x1);
			console.log('error1', getError(x1));
			console.log('');
		}

		while (true) {
			var grad1 = getGradient(x1, -1);
			var b1 = Math.max(0, getPolakRibiere(grad0, grad1));
			var s1 = makeStep(grad1, s0, b1);
			var a1 = lineSearch(x1, s1);
			var x2 = makeStep(x1, s1, a1);
			var error2 = getError(x2);

			if (debug > 2) {
				console.log('grad1', grad1);
				console.log('b1', b1);
				console.log('s1', s1);
				console.log('a1', a1);
				console.log('x2', x2);
				console.log('error2', error2);
			}

			stepSize = stepSize*0.5 + 0.5*getDistance(x1, x2);
			if (stepSize < 1e-6) {
				return {
					count: count,
					error: error2,
					par: x2,
				}
			}

			x0 = x1;
			x1 = x2;
			grad0 = grad1;
			s0 = s1;
			count++;
		}

		function log() {
			if (debug <= 1) return;
			console.log([
				count,
				Math.log10(error2).toFixed(6),
				x2.map(v => v.toFixed(6)).join('\t')
			].join('\t'));
		}
	
		throw Error();

		function lineSearch(x0, grad) {

			var t0 = -0.1;
			var t1 =  0.1;

			var r0 = getErrorDiffLine(x0, grad, t0);
			var r1 = getErrorDiffLine(x0, grad, t1);

			var tn = t0 - r0[1]*(t1-t0)/(r1[1]-r0[1]);
			var rn = getErrorDiffLine(x0, grad, tn);

			if (rn[0] < r0[0]) {
				if (rn[0] < r1[0]) {
					return tn;
				} else {
					return t1;
				}
			} else {
				if (r0[0] < r1[0]) {
					return t0;
				} else {
					return t1;
				}
			}
		}

		function getPolakRibiere(grad0, grad1) {
			var aSum = 0, bSum = 0;
			grad0.forEach((v0,i) => {
				var v1 = grad1[i];
				aSum += v1*(v1-v0);
				bSum += v0*v0;
			})
			return aSum/bSum;
		}

		function makeStep(x, d, a) {
			return x.map((v,i) => v + d[i]*a)
		}

		function getError(par) {
			var error = 0;
			data.forEach(e => {
				var x = e[0];
				var yGoal = e[1];
				var yIs = app.func(x, par);
				error += sqr(yIs-yGoal);
			})
			return error;
		}

		function getErrorDiffLine(par, grad, t) {
			var error0 = 0;
			var error1 = 0;
			data.forEach(e => {
				var x = e[0];
				var yGoal = e[1];
				var yIs = app.linDiff0(x, par, grad, t);
				error0 += sqr(yIs-yGoal);
				error1 += 2*(yIs-yGoal)*app.linDiff1(x, par, grad, t);
				//error2 += 2*((yIs-yGoal)*app.linDiff2(x, par, grad, t) + sqr(app.linDiff1(x, par, grad, t)));
			})
			return [error0, error1];
		}

		function getGradient(par, multiplier) {
			var grad = app.initGrad();
			data.forEach(e => {
				var x = e[0];
				var yGoal = e[1];
				var yIs = app.func(x, par);
				app.grad(x, par).forEach((g,i) => {
					grad[i] += (yIs-yGoal)*g;
				})
			})
			grad.forEach((g,i) => grad[i] *= multiplier);
			return grad;
		}

		function getDistance(p0, p1) {
			return Math.sqrt(p0.reduce((sum,v0,i) => sum+sqr(v0-p1[i]),0));
		}
	}
}

function approximatorPoly(exponents) {
	var length = exponents.length;
	var zeros = new Array(length);
	zeros.fill(0);
	return {
		initX:    () => zeros.slice(),
		initGrad: () => zeros.slice(),
		func:     (x, par)          => exponents.reduce((sum, e, i) => sum + Math.pow(x,e)*par[i], 0),
		grad:      x                => exponents.map(e => Math.pow(x,e)),
		linDiff0: (x, par, grad, t) => exponents.reduce((sum, e, i) => sum + Math.pow(x,e)*(par[i]+t*grad[i]), 0),
		linDiff1: (x, par, grad, t) => exponents.reduce((sum, e, i) => sum + Math.pow(x,e)*grad[i], 0),
		linDiff2: (x, par, grad, t) => 0,
	}
}

function approximatorPoly1(exponents) {
	var length = exponents.length;
	var zeros = new Array(length);
	zeros.fill(0);
	return {
		initX:    () => zeros.slice(),
		initGrad: () => zeros.slice(),
		func:     (x, par)          => exponents.reduce((sum, e, i) => sum + Math.pow(x,e)* par[i]           , 0) + x*(1-exponents.reduce((sum, e, i) => sum + par[i]            , 0)),
		grad:      x                => exponents.map(e => Math.pow(x,e) - x),
		linDiff0: (x, par, grad, t) => exponents.reduce((sum, e, i) => sum + Math.pow(x,e)*(par[i]+t*grad[i]), 0) + x*(1-exponents.reduce((sum, e, i) => sum + par[i] + t*grad[i], 0)),
		linDiff1: (x, par, grad, t) => exponents.reduce((sum, e, i) => sum + Math.pow(x,e)*          grad[i] , 0) + x*( -exponents.reduce((sum, e, i) => sum +            grad[i], 0)),
		linDiff2: (x, par, grad, t) => 0,
		//fixPar: par => {
		//	exponents.reduce((sum, e, i) => sum +   par[i], 0) maximal 1
		//	exponents.reduce((sum, e, i) => sum + e*par[i], 0) mindestens 0
		//}
	}
}


function sqr(v) { return v*v }
