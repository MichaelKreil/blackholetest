"use strict"

function normalize3(vec) {
	var l = length3(vec);
	return vec3(vec.x/l, vec.y/l, vec.z/l)
}

function vec3(x,y,z) {
	return { x:x, y:y, z:z }
}

function length3(vec) {
	return Math.sqrt(vec.x*vec.x + vec.y*vec.y + vec.z*vec.z)
}

function scale3(vec, scale) {
	return vec3(vec.x*scale, vec.y*scale, vec.z*scale);
}

function add3(vec1, vec2) {
	return vec3(vec1.x+vec2.x, vec1.y+vec2.y, vec1.z+vec2.z);
}

function substract3(vec1, vec2) {
	return vec3(vec1.x-vec2.x, vec1.y-vec2.y, vec1.z-vec2.z);
}

function dot3(vec1, vec2) {
	return vec1.x*vec2.x + vec1.y*vec2.y + vec1.z*vec2.z;
}