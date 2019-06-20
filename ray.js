"use strict"

var maxRadius = 1e6;

var result = {
	calculatePathSchwarzschild: calculatePathSchwarzschild,
	drawSpace: drawSpace,
	drawChart: drawChart,
	drawParameterSpace: drawParameterSpace,
	getTanhPhiSum: getTanhPhiSum,
	Vec: Vec,
};

if (typeof module === 'object') {
	module.exports = result;
} else {
	Object.keys(result).forEach(function (key) {
		window[key] = result[key]
	})
}

function calculatePathSchwarzschild(pos0, dir0, stepSize) {
	if (!stepSize) stepSize = 1e-3;
	var m = 1;
	dir0.normalize();

	var radius0 = pos0.getLength();
	var radius = radius0;
	var L = radius0*pos0.getAngleToSin(dir0)/Math.sqrt(1-2*m/radius0);

	if (radius0 < m*2) return {
		count: 0,
		path: [],
		phiSum: 0,
		L: L,
	}
	var deltaRadius = pos0.getAngleToCos(dir0);

	var phi0 = pos0.getAngle();
	var phi = phi0;

	var i = 0;

	var path = [];
	addPoint();

	while (true) {
		i++;

		var step = stepSize*radius;

		phi += step*L/(radius*radius);
		deltaRadius += step*(L*L)*(radius-3*m)/Math.pow(radius, 4);
		radius += step*deltaRadius;

		if (radius <= 2) break;
		if (radius >= 1e5) break;

		addPoint();

		if (i > 1e5) {
			break;
		}
	}

	return {
		count: i,
		path: path,
		phiSum: Math.abs(phi-phi0),
		L: L,
	}

	function addPoint() {
		path.push({
			pos:{
				x:radius*Math.cos(phi),
				y:radius*Math.sin(phi),
				r:radius,
				phi:phi,
			},
		});
	}
}

function drawSpace(img, vec0, vecdx, vecdy, cbDraw) {
	var dir = Vec(1, 0).normalize();
	renderPointWrapper(img, cbDraw, function (x0,y0) {
		var pos = vec0.getClone().addScaled(vecdx, x0/img.width).addScaled(vecdy, y0/img.height);

		var result = calculatePathSchwarzschild(pos, dir, 1e-1)

		var c = result.phiSum/10;

		var r = pos.getLength();
		var phi = pos.getAngleTo(dir);
		var isInside = Math.cos(phi) < (3/r-1)*Math.sqrt(1+6/r);

		return [c, isInside ? [2,1,0.5] : [0.5,1,2]];
	});
}

function getOrbitAngle(r) {
	return Math.acos((3/r-1)*Math.sqrt(1+6/r));
}

function getX2R(x, precision) {
	if (x <   precision) return 2+precision;
	if (x > 1-precision) return maxRadius;
	return 2/(1-x);
}
function getY2Phi(y,r,inside) {
	var phiOrbit = getOrbitAngle(r);
	return inside ? y*phiOrbit : Math.PI - (Math.PI-phiOrbit)*y;
}

function getPhi2Y(phi,r,inside) {
	var phiOrbit = getOrbitAngle(r);
	return inside ? phiOrbit/phi : (Math.PI-phi)/(Math.PI-phiOrbit);
}

function getTanhPhiSum(x, y, inside, precision) {
	if (!precision) precision = 1e-2;

	var r = getX2R(x, precision);
	var a = getY2Phi(y, r, inside);

	var pos = Vec(r*Math.cos(a), r*Math.sin(a));
	var result = calculatePathSchwarzschild(pos, Vec(1,0), precision);
	return Math.tanh(result.phiSum);
	//return result.phiSum*0.5;
	//return Math.atan(result.phiSum/Math.PI)/(0.5*Math.PI);
	//return result.phiSum/10;
}

function drawParameterSpace(img, cbDraw) {

	renderPointWrapper(img, cbDraw, function (x0,y0) {
		var x = x0/img.width;
		var y = y0/img.height;

		var value = getTanhPhiSum(x,y,false);
		return [value, [1,1,1]];
	});
}

function drawChart(x0,y0,ctx) {
	var data = [];

	var width = ctx.canvas.width;
	var height = ctx.canvas.height;

	ctx.fillStyle = '#444';
	ctx.fillRect(0,0,width,height);

	ctx.strokeStyle = '#a00';
	ctx.beginPath();
	for (var xi = 0; xi < width; xi++) {
		var x = xi/(width-1);
		var v = getTanhPhiSum(x,0.5,false);
		var yi = (1-v)*height;
		if (xi === 0) ctx.moveTo(xi,yi); else ctx.lineTo(xi,yi);
	}
	ctx.stroke();

	ctx.strokeStyle = '#0a0';
	ctx.beginPath();
	for (var xi = 0; xi < width; xi++) {
		var x = xi/(width-1);
		var v = getTanhPhiSum(x0,x,false);
		data.push(x.toFixed(4)+'\t'+v.toFixed(4));
		var yi = (1-v)*height;
		if (xi === 0) ctx.moveTo(xi,yi); else ctx.lineTo(xi,yi);
	}
	ctx.stroke();

	console.log(data.join('\n'));
}

function renderPointWrapper(img, cbDraw, cbPixel) {
	var points = getPointList(img.width, img.height, 3);
	renderPoints()

	function renderPoints() {
		var tMax = Date.now()+100;

		while (true) {
			if (points.length === 0) return cbDraw();
			if (Date.now() > tMax) {
				cbDraw();
				setTimeout(renderPoints, 0);
				return;
			}

			var p = points.pop();
			var x0s  = p[0];
			var y0   = p[1];
			var size = p[2];

			x0s.forEach(function (x0) {
				var result = cbPixel(x0, y0);
				var brightness = result[0];
				var color = result[1];

				var r = 255*Math.pow(Math.min(1, Math.max(0, brightness)), 1/color[0]);
				var g = 255*Math.pow(Math.min(1, Math.max(0, brightness)), 1/color[1]);
				var b = 255*Math.pow(Math.min(1, Math.max(0, brightness)), 1/color[2]);

				for (var xi = x0; xi < x0+size; xi++) {
					if (xi >= img.width) continue;
					for (var yi = y0; yi < y0+size; yi++) {
						if (yi >= img.height) continue;

						var index = (yi*img.width+xi)*4;
						img.data[index+0] = r;
						img.data[index+1] = g;
						img.data[index+2] = b;
						img.data[index+3] = 255;
					}
				}
			})
		}
	}
}

function getPointList(width0, height0, minSize) {
	if (!minSize) minSize = 0;
	var maxLevel = 6;
	var points = [];
	for (var level = minSize; level <= maxLevel; level++) {
		var size = Math.pow(2, level);
		var width  = Math.floor((width0 -1)/size)+1;
		var height = Math.floor((height0-1)/size)+1;
		for (var y = height-1; y >= 0; y--) {
			var xs = [];
			for (var x = 0; x < width; x++) {
				if ((x % 2 === 0) && (y % 2 === 0) && (level !== maxLevel)) continue;
				xs.push(x*size);
			}
			points.push([xs, y*size, size]);
		}
	}
	return points;
}

function Vec(x,y) {
	var me = {
		x:x,
		y:y,
		add: (v) => {me.x += v.x; me.y += v.y; return me},
		addScaled: (v, s) => {me.x += v.x*s; me.y += v.y*s; return me},
		getAngle: () => Math.atan2(me.y, me.x),
		getAngleTo: (v) => Math.atan2(me.x*v.y - me.y*v.x, me.x*v.x + me.y*v.y),
		getAngleToCos: (v) => (me.x*v.x + me.y*v.y)/(me.getLength()*v.getLength()),
		getAngleToSin: (v) => (me.x*v.y - me.y*v.x)/(me.getLength()*v.getLength()),
		getClone: () => Vec(me.x, me.y),
		getLength2: () => me.x*me.x + me.y*me.y,
		getLength: () => Math.sqrt(me.x*me.x + me.y*me.y),
		getValues: () => [me.x, me.y, me.getLength()],
		normalize: () => {var l = me.getLength(); me.x /= l; me.y /= l; return me},
		scale: (s) => {me.x *= s; me.y *= s; return me},
		set: (v) => { me.x = v.x; me.y = v.y },
		substract: (v) => {me.x -= v.x; me.y -= v.y; return me},
		toString: () => '['+me.x.toFixed(6)+'\t'+me.y.toFixed(6)+']',
	}
	return me;
}

function sqr(v) {
	return v*v;
}