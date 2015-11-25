#ifdef GL_ES
precision highp float;
#endif

varying vec2 vPosition;
varying float morphFactor;
uniform mat4 worldViewProjection, worldView;
uniform float gridSize, gridScale, startGridScale, textureScale, detailScale;
uniform sampler2D uRockHeight, uGrassHeight, uDirtHeight;
uniform sampler2D uMaterialMix;
uniform sampler2D uTerrain;
uniform float terrainSize,detailSize;
uniform vec3 camera;
attribute vec3 position;


vec2 transformPosition(vec2 position) {
	return (position / gridSize)*gridScale;
}

vec2 invTransformPosition(vec2 position) {
	return (position / gridScale)*gridSize;
}

vec4 texture2DRect(sampler2D source, vec2 coord, vec2 size) {
	return texture2DLod(source, (coord + 0.5) / size, 0.0);
}

vec4 texture2DInterp(sampler2D source, vec2 coord, vec2 size) {
	vec2 f = fract(coord*terrainSize - 0.5);
	vec2 c = floor(coord*terrainSize - 0.5);

	vec4 lb = texture2DRect(source, c + vec2(0.0, 0.0), size);
	vec4 lt = texture2DRect(source, c + vec2(0.0, 1.0), size);
	vec4 rb = texture2DRect(source, c + vec2(1.0, 0.0), size);
	vec4 rt = texture2DRect(source, c + vec2(1.0, 1.0), size);

	vec4 a = mix(lb, lt, f.t);
	vec4 b = mix(rb, rt, f.t);
	return mix(a, b, f.s);
}

float getMiplevel(vec2 position, float texelSize) {
	float dist = max(abs(position.x), abs(position.y));

	float cellSize = startGridScale / (gridSize*2.0);

	float correction = log2(cellSize / texelSize);
	float distanceLevel = max(0.0, log2(dist*4.0 / startGridScale));

	return distanceLevel + correction;
}

vec3 getMaterialMix(vec2 position) {
	vec2 texcoord = vPosition / textureScale;
	vec3 mixFactors = texture2D(uMaterialMix, position / textureScale).rgb;
	return mixFactors /= (mixFactors.r + mixFactors.g + mixFactors.b);
}

float getDetailHeight(vec2 position, vec2 camera) {
	float scaleFactor = textureScale*detailScale;
	float texelSize = scaleFactor / detailSize;
	vec2 texcoord = position / scaleFactor;

	float miplevel = getMiplevel(abs(position - camera), texelSize);

	float rockHeight = texture2DLod(uRockHeight, texcoord, miplevel).x;
	float grassHeight = texture2DLod(uGrassHeight, texcoord, miplevel).x;
	float dirtHeight = texture2DLod(uDirtHeight, texcoord, miplevel).x;

	vec3 mixFactors = getMaterialMix(position);

	return (
		mixFactors.r*dirtHeight +
		mixFactors.g*grassHeight +
		mixFactors.b*rockHeight
		)*detailScale*textureScale;
}

vec3 getNormal(vec2 derivatives) {
	vec3 sDirection = vec3(1, derivatives.s, 0);
	vec3 tDirection = vec3(0, derivatives.t, 1);
	return normalize(cross(tDirection, sDirection));
}

vec3 getOffsetPosition(vec2 coord, vec2 camera) {
	float texelSize = textureScale / terrainSize;
	float miplevel = getMiplevel(abs(coord - camera), texelSize);
	vec2 texcoord = coord / textureScale;

	vec3 mipInfo = texture2DLod(
		uTerrain, texcoord, max(1.0, miplevel)
		).xyz*vec3(textureScale, 1, 1);


	float detailHeight = getDetailHeight(coord, camera);

	if (miplevel >= 1.0) {
		vec3 normal = getNormal(mipInfo.yz);
		return vec3(coord.x, mipInfo.x, coord.y) + detailHeight*normal;
	}
	else {
		vec3 baseInfo = texture2DInterp(
			uTerrain, texcoord, vec2(terrainSize)
			).xyz*vec3(textureScale, 1, 1);

		vec3 info = mix(baseInfo, mipInfo, max(0.0, miplevel));
		vec3 normal = getNormal(info.yz);

		return vec3(coord.x, info.x, coord.y) + detailHeight*normal;
	}
}




float getHeight(vec2 position, vec2 camera) {
	float texelSize = textureScale / terrainSize;
	float miplevel = getMiplevel(abs(position - camera), texelSize);
	vec2 texcoord = position / textureScale;

	float mipHeight = texture2DLod(
		uTerrain, texcoord, max(1.0, miplevel)
		).x*textureScale;

	float detailHeight = getDetailHeight(position, camera);

	if (miplevel >= 1.0) {
		return detailHeight + mipHeight;
	}
	else {
		float baseHeight = texture2DInterp(
			uTerrain, texcoord, vec2(terrainSize)
			).x*textureScale;

		return detailHeight + mix(
			baseHeight, mipHeight, max(0.0, miplevel)
			);
	}
}

float linstep(float edge0, float edge1, float value) {
	return clamp((value - edge0) / (edge1 - edge0), 0.0, 1.0);
}


void main() {
	vec2 pos2d = vec2(position.x, position.z);
	vec2 cameraPosition = invTransformPosition(camera.xz) ;
	vec2 pos = pos2d + floor(cameraPosition);

	vec2 modPos = mod(pos, 2.0);
	vec2 ownCoord = vPosition = transformPosition(pos);
	vec3 ownPosition = getOffsetPosition(ownCoord, camera.xz);

	vec2 cameraDelta = abs(pos - cameraPosition);
	float chebyshevDistance = max(cameraDelta.x, cameraDelta.y);
	morphFactor = linstep(
		gridSize / 4.0 + 1.0,
		gridSize / 2.0 - 1.0,
		chebyshevDistance
		);

	if (length(modPos) > 0.5) {
		vec2 neighbor1Coord = transformPosition(pos + modPos);
		vec2 neighbor2Coord = transformPosition(pos - modPos);

		vec3 neighbor1Position = getOffsetPosition(neighbor1Coord, camera.xz);
		vec3 neighbor2Position = getOffsetPosition(neighbor2Coord, camera.xz);

		vec3 neighborPosition = (neighbor1Position + neighbor2Position) / 2.0;
		vec3 resultPosition = mix(ownPosition, neighborPosition, morphFactor);
		gl_Position = worldViewProjection * vec4(resultPosition, 1);
	}
	else {
		gl_Position = worldViewProjection* vec4(ownPosition, 1);
	}
}