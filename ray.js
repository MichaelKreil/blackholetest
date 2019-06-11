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

	var L = radius0*radius0*pos0.getAngleToSin(dir0);

	var radius = radius0;
	var deltaRadius = pos0.getAngleToCos(dir0);

	var phi  = pos0.getAngle();

	var i = 0;

	var path = [];
	addPoint();

	while (true) {
		i++;

		var step = 1e-3*radius;

		phi += step*L/(radius*radius);

		deltaRadius += step*(L*L)*(radius-3*m)/Math.pow(radius, 4);
		radius += step*deltaRadius;

		if (radius < 0.1) break;
		if (radius > maxRadius) break;

		addPoint();

		if (i > 1e4) {
			break;
		}
	}

	return {
		count: i,
		path: path
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