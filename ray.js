var maxRadius = 1e6;

var result = {
	calculatePathSchwarzschild: calculatePathSchwarzschild,
	Vec: Vec,
};

if (typeof module === 'object') {
	module.exports = result;
} else {
	Object.keys(result).forEach(function (key) {
		window[key] = result[key]
	})
}

function calculatePathSchwarzschild(pos0, dir0) {
	var m = 1;
	dir0.normalize();

	var radius0 = pos0.getLength();
	var u = 1/radius0;
	var du = -pos0.getAngleToCos(dir0)/(pos0.getAngleToSin(dir0)*radius0);
	var direction = 1;
	if (pos0.getAngleToSin(dir0) < 0) {
		du = -du;
		direction = -1;
	}

	var phi = pos0.getAngle();

	var i = 0;

	var path = [];
	addPoint();

	while (true) {
		i++;

		var step = 1e-2;

		phi += direction*step;
		var ddu = 3*m*u*u-u;
		du += step*ddu;
		u += step*du;

		if (u < 0) break;
		if (u > 1e10) break;

		addPoint();

		if (i > 1e5) {
			break;
		}
	}

	return {
		count: i,
		path: path
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