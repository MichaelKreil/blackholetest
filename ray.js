var maxRadius = 1e6;

var result = {
	calculatePathSchwarzschild: calculatePathSchwarzschild,
	calculateParameterSpace: calculateParameterSpace,
	Vec: Vec,
};

if (typeof module === 'object') {
	module.exports = result;
} else {
	Object.keys(result).forEach(function (key) {
		window[key] = result[key]
	})
}

function calculatePathSchwarzschild(pos0, dir0, step) {
	if (!step) step = 1e-3;
	var m = 1;
	dir0.normalize();

	var radius0 = pos0.getLength();
	if (radius0 < m*1e-2) return {
		count: 0,
		path: [],
		phiSum: 0,
	}

	var u = 1/radius0;
	var L = radius0*pos0.getAngleToSin(dir0);///Math.sqrt(1-2*m/radius0);

	var du = -pos0.getAngleToCos(dir0)/(pos0.getAngleToSin(dir0)*radius0);
	//du *= Math.sqrt(1-2*m/radius0);
	var direction = 1;
	if (pos0.getAngleToSin(dir0) < 0) {
		du = -du;
		direction = -1;
	}

	var phi0 = pos0.getAngle();
	var phi = phi0;

	var i = 0;

	var path = [];
	addPoint();

	while (true) {
		i++;

		phi += direction*step;//*Math.sqrt(1-2*m*u);
		var ddu = /*m/(L*L) +*/ 3*m*u*u - u;
		du += step*ddu;
		u += step*du;

		//if (Math.abs(pos0.getAngleToSin(dir0)) < 1e-3) console.log(phi, ddu, du, u);

		if (u <= 0) break;
		if (u >= 1e2) break;

		addPoint();

		if (i > 1e4) {
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
		var radius = 1/u;
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

function calculateParameterSpace(img, vec0, vecdx, vecdy, cb) {
	var dir = Vec(0, 1).normalize();
	var points = [];
	for (var y = 0; y < img.height; y++) {
		for (var x = 0; x < img.width; x++) {
			var size = 1;
			level = 6;
			if ((x %  2 === 0) && (y %  2 === 0)) { level = 5; size = 2; }
			if ((x %  4 === 0) && (y %  4 === 0)) { level = 4; size = 4; }
			if ((x %  8 === 0) && (y %  8 === 0)) { level = 3; size = 8; }
			if ((x % 16 === 0) && (y % 16 === 0)) { level = 2; size = 16; }
			if ((x % 32 === 0) && (y % 32 === 0)) { level = 1; size = 32; }
			if ((x % 64 === 0) && (y % 64 === 0)) { level = 0; size = 64; }
			//if (level > 5) continue;
			points.push([x,y,size,level+y/img.height]);
		}
	}
	points.sort(function (a,b) { return b[3]-a[3]})
	renderPoints();

	function renderPoints() {
		var tMax = Date.now()+40;

		while (true) {
			if (points.length === 0) return cb();
			if (Date.now() > tMax) {
				cb();
				setTimeout(renderPoints, 0);
				return;
			}

			var p = points.pop();
			var x0 = p[0];
			var y0 = p[1];
			var size = p[2];

			var pos = vec0.getClone().addScaled(vecdx, x0/img.width).addScaled(vecdy, y0/img.height);

			var result = calculatePathSchwarzschild(pos, dir, 1e-2)

			var c = result.phiSum/10;

			//c = Math.round(c*16)/16;
			var lastPoint = result.path[result.path.length-1].pos;
			var er = lastPoint.r > 1 ? 0.5 : 2.0;
			var eg = lastPoint.r > 1 ? 1.0 : 2.0;
			var eb = lastPoint.r > 1 ? 2.0 : 0.5;
			var r = 255*Math.pow(Math.min(1, Math.max(0, c)), 1/er);
			var g = 255*Math.pow(Math.min(1, Math.max(0, c)), 1/eg);
			var b = 255*Math.pow(Math.min(1, Math.max(0, c)), 1/eb);

			for (var xi = 0; xi < size; xi++) {
				for (var yi = 0; yi < size; yi++) {
					var index = ((y0+yi)*img.width+(x0+xi))*4;
					img.data[index+0] = r;
					img.data[index+1] = g;
					img.data[index+2] = b;
					img.data[index+3] = 255;
				}
			}
		}
	}
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