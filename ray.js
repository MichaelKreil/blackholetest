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
	if (radius0 < 2*m) return {
		count: 0,
		path: [],
		phiSum: 0,
	}

	var u = 1/radius0;
	var L = radius0*pos0.getAngleToSin(dir0)/Math.sqrt(1-2*m/radius0);

	var du = -pos0.getAngleToCos(dir0)/(pos0.getAngleToSin(dir0)*radius0);
	du *= Math.sqrt(1-2*m/radius0);
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

		phi += direction*step;
		var ddu = /*m/(L*L) +*/ 3*m*u*u - u;
		du += step*ddu;
		u += step*du;

		//if (Math.abs(pos0.getAngleToSin(dir0)) < 1e-3) console.log(phi, ddu, du, u);

		if (u <= 0) break;
		if (u >= 0.5) break;

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

function calculateParameterSpace(img, vec0, vecdx, vecdy) {
	var tMax = Date.now()+5000;

	var dir = Vec(0, 1).normalize();
	for (var y = 0; y < img.height; y++) {
		for (var x = 0; x < img.width; x++) {
			var pos = vec0.getClone().addScaled(vecdx, x/img.width).addScaled(vecdy, y/img.height);

			var result = calculatePathSchwarzschild(pos, dir, 1e-2)

			var c = result.phiSum/10;

			//c = Math.round(c*16)/16;
			c = 255*Math.min(1, Math.max(0, c));
			var index = (y*img.width+x)*4;
			img.data[index+0] = c;
			img.data[index+1] = c;
			img.data[index+2] = c;
			img.data[index+3] = 255;

			if (Date.now() > tMax) return;
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