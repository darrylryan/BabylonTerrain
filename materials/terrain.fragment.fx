#extension GL_OES_standard_derivatives : enable
#ifdef GL_ES
precision highp float;
#endif

varying vec2 vPosition;
varying float morphFactor;
uniform float gridSize, gridScale, textureScale, detailScale;
uniform sampler2D uAlbedo;
uniform sampler2D uRockColor, uDirtColor, uGrassColor;
uniform vec3 rockAvg, dirtAvg, grassAvg;
uniform sampler2D uTerrain;
uniform sampler2D uRockHeight, uDirtHeight, uGrassHeight;
uniform sampler2D uMaterialMix;


vec3 gammasRGB(vec3 color) {
	return mix(
		color*12.92,
		pow(color, vec3(1.0 / 2.4))*1.055 - 0.055,
		step((0.04045 / 12.92), color)
		);
}
vec3 degammasRGB(vec3 color) {
	return mix(
		color / 12.92,
		pow((color + 0.055) / 1.055, vec3(2.4)),
		step(0.04045, color)
		);
}



vec3 getMaterialMix(vec2 position) {
	vec2 texcoord = vPosition / textureScale;
	vec3 mixFactors = texture2D(uMaterialMix, position / textureScale).rgb;
	return mixFactors /= (mixFactors.r + mixFactors.g + mixFactors.b);
}

vec3 getDetailColor(sampler2D source) {
	vec2 texcoord = (vPosition / textureScale) / detailScale;
	return degammasRGB(texture2D(source, texcoord).rgb);
}


vec3 getAlbedo(vec3 materialMix) {
	vec2 texcoord = vPosition / textureScale;
	vec3 albedo = degammasRGB(texture2D(uAlbedo, texcoord).rgb);

	vec3 rockAlbedo = (albedo / rockAvg)*getDetailColor(uRockColor);
	vec3 dirtAlbedo = (albedo / dirtAvg)*getDetailColor(uDirtColor);
	vec3 grassAlbedo = (albedo / grassAvg)*getDetailColor(uGrassColor);

	vec3 detail = (
		materialMix.x*dirtAlbedo +
		materialMix.y*grassAlbedo +
		materialMix.z*rockAlbedo
		);
	return mix(albedo, detail, 1.0);
}

vec2 getDetailDerivative(sampler2D source) {
	vec2 texcoord = (vPosition / textureScale) / detailScale;
	return texture2D(source, texcoord).yz;
}

vec2 getDetailDerivatives(vec3 materialMix) {
	vec2 texcoord = vPosition / textureScale;
	vec2 derivatives = texture2D(uTerrain, texcoord).yz;

	vec2 rockDerivatives = getDetailDerivative(uRockHeight);
	vec2 dirtDerivatives = getDetailDerivative(uDirtHeight);
	vec2 grassDerivatives = getDetailDerivative(uGrassHeight);

	return (
		materialMix.r*dirtDerivatives +
		materialMix.g*grassDerivatives +
		materialMix.b*rockDerivatives
		);
}

vec3 getNormal(vec3 materialMix) {
	vec2 texcoord = vPosition / textureScale;
	vec2 basisDerivatives = texture2D(uTerrain, texcoord).yz;

	vec3 tangent = normalize(vec3(1, basisDerivatives.s, 0));
	vec3 cotangent = normalize(vec3(0, basisDerivatives.t, 1));
	vec3 normal = cross(cotangent, tangent);

	vec2 detailDerivatives = getDetailDerivatives(materialMix);

	tangent = tangent + normal*detailDerivatives.s;
	cotangent = cotangent + normal*detailDerivatives.t;
	vec3 detailNormal = normalize(cross(cotangent, tangent));

	return mix(normal, detailNormal, 1.0);
}

vec3 getIncident(vec3 normal) {
	float lambert = clamp(dot(normal, normalize(vec3(1, 0.5, 0))), 0.0, 1.0);
	float ambient = 0.03;
	return vec3(lambert + ambient);
}

void main() {
	vec3 materialMix = getMaterialMix(vPosition);
	vec3 normal = getNormal(materialMix);
	vec3 incident = getIncident(normal);
	vec3 albedo = getAlbedo(materialMix);
	vec3 excident = albedo*incident;
	vec3 display = excident;
	gl_FragColor = vec4(gammasRGB(display), 1);
}