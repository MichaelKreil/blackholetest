var maxRadius = 1e6;
var maxDirAngleSum = 100;
var maxPosAngleSum = 4*Math.PI;
var stepFactor = 0.01;
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

	var r0 = pos0.getLength();

	var L = r0*r0*pos0.getAngleToSin(dir0);

	var r = r0;
	var dr = r0*pos0.getAngleToCos(dir0);

	var phi  = pos0.getAngle();

	var maxR = r;
	var minR = r;

	var i = 0;

	var path = [];
	addPoint();

	while (true) {
		i++;

		var step = 1e-3*r;

		var dphi = L/(r*r);
		var dx = -r*Math.sin(phi)*dphi + dr*Math.cos(phi);
		var dy =  r*Math.cos(phi)*dphi + dr*Math.sin(phi);
		var pos = Vec(r*Math.cos(phi), r*Math.sin(phi));
		var dir = Vec(dx, dy);
		
		phi += step*dphi;
		dr  += step*(L*L)*(r-3*m)/(r*r*r*r);
		r   += step*dr;

		if (r > maxR) maxR = r;
		if (r < minR) minR = r;

		if (r < 0.1) break;
		if (r > maxRadius) break;

		addPoint();

		if (i > 1e4) {
			break;
		}
	}

	return {
		count: i,
		path: path,
		maxPhi: phi,
		maxR: maxR,
	}

	function addPoint() {
		path.push({
			pos:{
				x:r*Math.cos(phi),
				y:r*Math.sin(phi),
				r:r,
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