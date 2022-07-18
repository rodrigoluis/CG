// globals used in rand() function
vec4 randVec4; // samples and holds the RGBA blueNoise texture value for this pixel
float randNumber; // the final randomly generated number (range: 0.0 to 1.0)
float counter; // will get incremented by 1 on each call to rand()
int channel; // the final selected color channel to use for rand() calc (range: 0 to 3, corresponds to R,G,B, or A)
float rand()
{
	counter++; // increment counter by 1 on every call to rand()
	// cycles through channels, if modulus is 1.0, channel will always be 0 (the R color channel)
	channel = int(mod(counter, 2.0)); 
	// but if modulus was 4.0, channel will cycle through all available channels: 0,1,2,3,0,1,2,3, and so on...
	randNumber = randVec4[channel]; // get value stored in channel 0:R, 1:G, 2:B, or 3:A
	return fract(randNumber); // we're only interested in randNumber's fractional value between 0.0 (inclusive) and 1.0 (non-inclusive)
	//return clamp(randNumber,0.0,0.999999999); // we're only interested in randNumber's fractional value between 0.0 (inclusive) and 1.0 (non-inclusive)
}
// from iq https://www.shadertoy.com/view/4tXyWN
// global seed used in rng() function
uvec2 seed;
float rng()
{
	seed += uvec2(1);
    	uvec2 q = 1103515245U * ( (seed >> 1U) ^ (seed.yx) );
    	uint  n = 1103515245U * ( (q.x) ^ (q.y >> 3U) );
	return float(n) * (1.0 / float(0xffffffffU));
}

vec3 randomSphereDirection()
{
    	float up = rng() * 2.0 - 1.0; // range: -1 to +1
	float over = sqrt( max(0.0, 1.0 - up * up) );
	float around = rng() * TWO_PI;
	return normalize(vec3(cos(around) * over, up, sin(around) * over));	
}

/* vec3 randomCosWeightedDirectionInHemisphere(vec3 nl)
{
	float r0 = sqrt(rng());
	float phi = rng() * TWO_PI;
	float x = r0 * cos(phi);
	float y = r0 * sin(phi);
	float z = sqrt(1.0 - r0 * r0);
	vec3 T = normalize(cross(nl.yzx, nl));
	vec3 B = cross(nl, T);
	return normalize(T * x + B * y + nl * z);
} */

//the following alternative skips the creation of tangent and bi-tangent vectors T and B
vec3 randomCosWeightedDirectionInHemisphere(vec3 nl)
{
	float z = rng() * 2.0 - 1.0;
	float phi = rng() * TWO_PI;
	float r = sqrt(1.0 - z * z);
    	return normalize(nl + vec3(r * cos(phi), r * sin(phi), z));
}

vec3 randomDirectionInSpecularLobe(vec3 reflectionDir, float roughness)
{
	float z = rng() * 2.0 - 1.0;
	float phi = rng() * TWO_PI;
	float r = sqrt(1.0 - z * z);
    	vec3 cosDiffuseDir = normalize(reflectionDir + vec3(r * cos(phi), r * sin(phi), z));
	return normalize( mix(reflectionDir, cosDiffuseDir, roughness * roughness) );
}

/* vec3 randomDirectionInPhongSpecular(vec3 reflectionDir, float shininess)
{
	float cosTheta = pow(rng(), 1.0 / (2.0 + shininess));
	float sinTheta = sqrt(1.0 - cosTheta * cosTheta);
	float phi = rng() * TWO_PI;
	float x = sinTheta * cos(phi);
	float y = sinTheta * sin(phi);
	vec3 T = normalize(cross(reflectionDir.yzx, reflectionDir));
	vec3 B = cross(reflectionDir, T);
	return normalize(T * x + B * y + reflectionDir * cosTheta);
} */

/* 
// this is my crude attempt at a Fibonacci-spiral sample point pattern on a hemisphere above a diffuse surface
#define N_POINTS 64.0 //64.0
vec3 randomCosWeightedDirectionInHemisphere(vec3 nl)
{
	float i = N_POINTS * rng();
			// the Golden angle in radians
	float phi = mod(i * 2.39996322972865332, TWO_PI);
	float r = sqrt(i / N_POINTS); // sqrt pushes points outward to prevent clumping in center of disk
	float x = r * cos(phi);
	float y = r * sin(phi);
	float z = sqrt(1.0 - r * r);
	
	vec3 U = normalize( cross( abs(nl.y) < 0.9 ? vec3(0, 1, 0) : vec3(0, 0, 1), nl ) );
	vec3 V = cross(nl, U);
	return normalize(x * U + y * V + z * nl);
} */

/* 
// like the function several functions above, 
// the following alternative skips the creation of tangent and bi-tangent vectors T and B 
vec3 randomCosWeightedDirectionInHemisphere(vec3 nl)
{
	float phi = rng() * TWO_PI;
	float theta = rng() * 2.0 - 1.0;
	return normalize(nl + vec3(sqrt(1.0 - theta * theta) * vec2(cos(phi), sin(phi)), theta));
} */