//-------------------------------------------------------------------
// pathtracing_sphere_intersect

/* bool solveQuadratic(float A, float B, float C, out float t0, out float t1)
{
	float discrim = B * B - 4.0 * A * C;
    
	if (discrim < 0.0)
        	return false;
    
	float rootDiscrim = sqrt(discrim);
	float Q = (B > 0.0) ? -0.5 * (B + rootDiscrim) : -0.5 * (B - rootDiscrim); 
	// float t_0 = Q / A; 
	// float t_1 = C / Q;
	// t0 = min( t_0, t_1 );
	// t1 = max( t_0, t_1 );
	t1 = Q / A; 
	t0 = C / Q;
	
	return true;
} */
// optimized algorithm for solving quadratic equations developed by Dr. Po-Shen Loh -> https://youtu.be/XKBX0r3J-9Y
// Adapted to root finding (ray t0/t1) for all quadric shapes (sphere, ellipsoid, cylinder, cone, etc.) by Erich Loftis
void solveQuadratic(float A, float B, float C, out float t0, out float t1)
{
	float invA = 1.0 / A;
	B *= invA;
	C *= invA;
	float neg_halfB = -B * 0.5;
	float u2 = neg_halfB * neg_halfB - C;
	float u = u2 < 0.0 ? neg_halfB = 0.0 : sqrt(u2);
	t0 = neg_halfB - u;
	t1 = neg_halfB + u;
}

//-----------------------------------------------------------------------------
float SphereIntersect( float rad, vec3 pos, vec3 rayOrigin, vec3 rayDirection )
//-----------------------------------------------------------------------------
{
	float t0, t1;
	vec3 L = rayOrigin - pos;
	float a = dot( rayDirection, rayDirection );
	float b = 2.0 * dot( rayDirection, L );
	float c = dot( L, L ) - (rad * rad);
	solveQuadratic(a, b, c, t0, t1);
	return t0 > 0.0 ? t0 : t1 > 0.0 ? t1 : INFINITY;
}

//-------------------------------------------------------------------
// pathtracing_cone_intersect
//--------------------------------------------------------------------------------------------------------
float ConeIntersect( vec3 p0, float r0, vec3 p1, float r1, vec3 rayOrigin, vec3 rayDirection, out vec3 n )
//-------------------------------------------------------------------------------------------------------- 
{
	r0 += 0.1;
	vec3 locX;
	vec3 locY;
	vec3 locZ=-(p1-p0)/(1.0 - r1/r0);
	
	rayOrigin-=p0-locZ;
	
	if(abs(locZ.x)<abs(locZ.y))
		locX=vec3(1,0,0);
	else
		locX=vec3(0,1,0);
		
	float len=length(locZ);
	locZ=normalize(locZ)/len;
	locY=normalize(cross(locX,locZ))/r0;
	locX=normalize(cross(locY,locZ))/r0;
	
	mat3 tm;
	tm[0]=locX;
	tm[1]=locY;
	tm[2]=locZ;
	
	rayDirection*=tm;
	rayOrigin*=tm;
	
	float dx=rayDirection.x;
	float dy=rayDirection.y;
	float dz=rayDirection.z;
	
	float x0=rayOrigin.x;
	float y0=rayOrigin.y;
	float z0=rayOrigin.z;
	
	float x02=x0*x0;
	float y02=y0*y0;
	float z02=z0*z0;
	
	float dx2=dx*dx;
	float dy2=dy*dy;
	float dz2=dz*dz;
	
	float det=(
		-2.0*x0*dx*z0*dz
		+2.0*x0*dx*y0*dy
		-2.0*z0*dz*y0*dy
		+dz2*x02
		+dz2*y02
		+dx2*z02
		+dy2*z02
		-dy2*x02
		-dx2*y02
        );
	
	if(det<0.0)
		return INFINITY;
		
	float t0=(-x0*dx+z0*dz-y0*dy-sqrt(abs(det)))/(dx2-dz2+dy2);
	float t1=(-x0*dx+z0*dz-y0*dy+sqrt(abs(det)))/(dx2-dz2+dy2);
	vec3 pt0=rayOrigin+t0*rayDirection;
	vec3 pt1=rayOrigin+t1*rayDirection;
	
	if(t0>0.0 && pt0.z>r1/r0 && pt0.z<1.0)
	{
		n=pt0;
		n.z=0.0;
		n=normalize(n);
		n.z=-pt0.z/abs(pt0.z);
		n=normalize(n);
		n=tm*n;
		return t0;
	}
        if(t1>0.0 && pt1.z>r1/r0 && pt1.z<1.0)
	{
		n=pt1;
		n.z=0.0;
		n=normalize(n);
		n.z=-pt1.z/abs(pt1.z);
		n=normalize(n);
		n=tm*-n;
		return t1;
	}
	
	return INFINITY;	
}

//-------------------------------------------------------------------
// pathtracing_capsule_intersect
//-----------------------------------------------------------------------------------------------------------
float CapsuleIntersect( vec3 p0, float r0, vec3 p1, float r1, vec3 rayOrigin, vec3 rayDirection, out vec3 n )
//-----------------------------------------------------------------------------------------------------------
{
	/*
	// used for ConeIntersect below, if different radius sphere end-caps are desired
	vec3 l  = p1-p0;
	float ld = length(l);
	l=l/ld;
	float d= r0-r1;
	float sa = d/ld;
	float h0 = r0*sa;
	float h1 = r1*sa;
	float cr0 = sqrt(r0*r0-h0*h0);
	float cr1 = sqrt(r1*r1-h1*h1);
	vec3 coneP0=p0+l*h0;
	vec3 coneP1=p1+l*h1;
	*/
	
	float t0=INFINITY;
	    
	float t1;
	vec3 uv1;
	vec3 n1;
	//t1 = ConeIntersect(coneP0,cr0,coneP1,cr1,rayOrigin, rayDirection,n1);
	t1 = OpenCylinderIntersect(p0,p1,r0,rayOrigin, rayDirection,n1);
	if(t1<t0)
	{
		t0=t1;
		n=n1;
	}
	t1 = SphereIntersect(r0,p0,rayOrigin, rayDirection);
	if(t1<t0)
	{
		t0=t1;
		n=(rayOrigin + rayDirection * t1) - p0;
	}
	t1 = SphereIntersect(r1,p1,rayOrigin, rayDirection);
	if(t1<t0)
	{
		t0=t1;
		n=(rayOrigin + rayDirection * t1) - p1;
	}
	    
	return t0;
}

//-------------------------------------------------------------------
// pathtracing_paraboloid_intersect
//-----------------------------------------------------------------------------------------------------------
float ParaboloidIntersect( float rad, float height, vec3 pos, vec3 rayOrigin, vec3 rayDirection, out vec3 n )
//-----------------------------------------------------------------------------------------------------------
{
	vec3 rd = rayDirection;
	vec3 ro = rayOrigin - pos;
	float k = height / (rad * rad);
	
	// quadratic equation coefficients
	float a = k * (rd.x * rd.x + rd.z * rd.z);
	float b = k * 2.0 * (rd.x * ro.x + rd.z * ro.z) - rd.y;
	float c = k * (ro.x * ro.x + ro.z * ro.z) - ro.y;
	float t0, t1;
	solveQuadratic(a, b, c, t0, t1);
	
	vec3 ip;
	
	if (t0 > 0.0)
	{
		ip = ro + rd * t0;
		n = vec3( 2.0 * ip.x, -1.0 / k, 2.0 * ip.z );
		// flip normal if it is facing away from us
		n *= sign(-dot(rd, n)) * 2.0 - 1.0; // sign is 0 or 1, map it to -1 and +1
		
		if (ip.y < height)
			return t0;
				
	}
	if (t1 > 0.0)
	{	
		ip = ro + rd * t1;
		n = vec3( 2.0 * ip.x, -1.0 / k, 2.0 * ip.z );
		// flip normal if it is facing away from us
		n *= sign(-dot(rd, n)) * 2.0 - 1.0; // sign is 0 or 1, map it to -1 and +1
		
		if (ip.y < height)
			return t1;		
	}
	
	return INFINITY;	
}

//-------------------------------------------------------------------
// pathtracing_unit_torus_intersect
// The following Torus quartic solver algo/code is from https://www.shadertoy.com/view/ssc3Dn by Shadertoy user 'mla'

float sgn(float x) 
{
	return x < 0.0 ? -1.0 : 1.0; // Return 1.0 for x == 0.0
}

float evalquadratic(float x, float A, float B, float C) 
{
  	return (A * x + B) * x + C;
}

float evalcubic(float x, float A, float B, float C, float D) 
{
  	return ((A * x + B) * x + C) * x + D;
}

// Quadratic solver from Kahan
int quadratic(float A, float B, float C, out vec2 res) 
{
  	float b = -0.5 * B, b2 = b * b;
  	float q = b2 - A * C;
  	if (q < 0.0) return 0;
  	float r = b + sgn(b) * sqrt(q);
  	if (r == 0.0) 
	{
  		res[0] = C / A;
    		res[1] = -res[0];
  	} 
	else 
	{
    		res[0] = C / r;
    		res[1] = r / A;
  	}

  	return 2;
}

// Numerical Recipes algorithm for solving cubic equation
int cubic(float a, float b, float c, float d, out vec3 res) 
{
  	if (a == 0.0) 
  	{
    		return quadratic(b, c, d, res.xy);
  	}
  	if (d == 0.0) 
  	{
    		res.x = 0.0;
    		return 1 + quadratic(a, b, c, res.yz);
  	}
  	float tmp = a; a = b / tmp; b = c / tmp; c = d / tmp;
  	// solve x^3 + ax^2 + bx + c = 0
  	float Q = (a * a - 3.0 * b) / 9.0;
  	float R = (2.0 * a * a * a - 9.0 * a * b + 27.0 * c) / 54.0;
  	float R2 = R * R, Q3 = Q * Q * Q;
  	if (R2 < Q3) 
  	{
    		float X = clamp(R / sqrt(Q3), -1.0, 1.0);
    		float theta = acos(X);
    		float S = sqrt(Q); // Q must be positive since 0 <= R2 < Q3
    		res[0] = -2.0 *S *cos(theta / 3.0) - a / 3.0;
    		res[1] = -2.0 *S *cos((theta + 2.0 * PI) / 3.0) - a / 3.0;
    		res[2] = -2.0 *S *cos((theta + 4.0 * PI) / 3.0) - a / 3.0;
    		return 3;
  	} 
  	else 
  	{
    		float alpha = -sgn(R) * pow(abs(R) + sqrt(R2 - Q3), 0.3333);
    		float beta = alpha == 0.0 ? 0.0 : Q / alpha;
    		res[0] = alpha + beta - a / 3.0;
    		return 1;
  	}
}

/* float qcubic(float B, float C, float D) {
  vec3 roots;
  int nroots = cubic(1.0,B,C,D,roots);
  // Sort into descending order
  if (nroots > 1 && roots.x < roots.y) roots.xy = roots.yx;
  if (nroots > 2) {
    if (roots.y < roots.z) roots.yz = roots.zy;
    if (roots.x < roots.y) roots.xy = roots.yx;
  }
  // And select the largest
  float psi = roots[0];
  psi = max(1e-6,psi);
  // and give a quick polish with Newton-Raphson
  for (int i = 0; i < 3; i++) {
    float delta = evalcubic(psi,1.0,B,C,D)/evalquadratic(psi,3.0,2.0*B,C);
    psi -= delta;
  }
  return psi;
} */

float qcubic(float B, float C, float D) 
{
  	vec3 roots;
  	int nroots = cubic(1.0, B, C, D, roots);
  	// Select the largest
  	float psi = roots[0];
  	if (nroots > 1) psi = max(psi, roots[1]);
  	if (nroots > 2) psi = max(psi, roots[2]);
  
  	// Give a quick polish with Newton-Raphson
  	float delta;
	delta = evalcubic(psi, 1.0, B, C, D) / evalquadratic(psi, 3.0, 2.0 * B, C);
	psi -= delta;
	delta = evalcubic(psi, 1.0, B, C, D) / evalquadratic(psi, 3.0, 2.0 * B, C);
    	psi -= delta;
  
  	return psi;
}

// The Lanczos quartic method
int lquartic(float c1, float c2, float c3, float c4, out vec4 res) 
{
  	float alpha = 0.5 * c1;
  	float A = c2 - alpha * alpha;
  	float B = c3 - alpha * A;
  	float a, b, beta, psi;
  	psi = qcubic(2.0 * A - alpha * alpha, A * A + 2.0 * B * alpha - 4.0 * c4, -B * B);
  	// There _should_ be a root >= 0, but sometimes the cubic
  	// solver misses it (probably a double root around zero).
  	psi = max(0.0, psi);
  	a = sqrt(psi);
  	beta = 0.5 * (A + psi);
  	if (psi <= 0.0) 
  	{
    		b = sqrt(max(beta * beta - c4, 0.0));
  	} 
  	else 
  	{
    		b = 0.5 * a * (alpha - B / psi);
  	}

  	int resn = quadratic(1.0, alpha + a, beta + b, res.xy);
  	vec2 tmp;
  	if (quadratic(1.0, alpha - a, beta - b, tmp) != 0) 
  	{ 
    		res.zw = res.xy;
    		res.xy = tmp;
    		resn += 2;
  	}

  	return resn;
}

// Note: the parameter below is renamed '_E', because Euler's number 'E' is already defined in 'pathtracing_defines_and_uniforms'
int quartic(float A, float B, float C, float D, float _E, out vec4 roots) 
{
	int nroots;
  	// Sometimes it's advantageous to solve for the reciprocal (if there are very large solutions)
  	if (abs(B / A) < abs(D /_E)) 
	{
    		nroots = lquartic(B / A, C / A, D / A,_E / A, roots);
  	} 
	else 
	{
    		nroots = lquartic(D /_E, C /_E, B /_E, A /_E, roots);
    		for (int i = 0; i < nroots; i++) 
		{
      			roots[i] = 1.0 / roots[i];
    		}
  	}
  
  	return nroots;
}


float UnitTorusIntersect(vec3 ro, vec3 rd, float k, out vec3 n) 
{
	// Note: the vec3 'rd' might not be normalized to unit length of 1, 
	//  in order to allow for inverse transform of intersecting rays into Torus' object space
	k = mix(0.5, 1.0, k);
	float torus_R = max(0.0, k); // outer extent of the entire torus/ring
	float torus_r = max(0.01, 1.0 - k); // thickness of circular 'tubing' part of torus/ring
	float torusR2 = torus_R * torus_R;
	float torusr2 = torus_r * torus_r;
	
	float U = dot(rd, rd);
	float V = 2.0 * dot(ro, rd);
	float W = dot(ro, ro) - (torusR2 + torusr2);
	// A*t^4 + B*t^3 + C*t^2 + D*t + _E = 0
	float A = U * U;
	float B = 2.0 * U * V;
	float C = V * V + 2.0 * U * W + 4.0 * torusR2 * rd.z * rd.z;
	float D = 2.0 * V * W + 8.0 * torusR2 * ro.z * rd.z;
// Note: the float below is renamed '_E', because Euler's number 'E' is already defined in 'pathtracing_defines_and_uniforms'
	float _E = W * W + 4.0 * torusR2 * (ro.z * ro.z - torusr2);

	vec4 res = vec4(0);
	int nr = quartic(A, B, C, D, _E, res);
	if (nr == 0) return INFINITY;
  	// Sort the roots.
  	if (res.x > res.y) res.xy = res.yx; 
  	if (nr > 2) 
	{
    		if (res.y > res.z) res.yz = res.zy; 
    		if (res.x > res.y) res.xy = res.yx;
  	}
	if (nr > 3) 
	{
		if (res.z > res.w) res.zw = res.wz; 
		if (res.y > res.z) res.yz = res.zy; 
		if (res.x > res.y) res.xy = res.yx; 
	}
  
	float t = INFINITY;
	
	t = (res.w > 0.0) ? res.w : t;	
	t = (res.z > 0.0) ? res.z : t;
	t = (res.y > 0.0) ? res.y : t;	
	t = (res.x > 0.0) ? res.x : t;
		
	vec3 pos = ro + t * rd;
	//n = pos * (dot(pos, pos) - torusr2 - torusR2 * vec3(1, 1,-1));

	float kn = sqrt(torusR2 / dot(pos.xy, pos.xy));
	pos.xy -= kn * pos.xy;
	n = pos;
	
  	return t;
}

//-------------------------------------------------------------------
// pathtracing_box_intersect
//-----------------------------------------------------------------------------------------------------------------------------
float BoxIntersect( vec3 minCorner, vec3 maxCorner, vec3 rayOrigin, vec3 rayDirection, out vec3 normal, out bool isRayExiting )
//-----------------------------------------------------------------------------------------------------------------------------
{
	vec3 invDir = 1.0 / rayDirection;
	vec3 near = (minCorner - rayOrigin) * invDir;
	vec3 far  = (maxCorner - rayOrigin) * invDir;

	vec3 tmin = min(near, far);
	vec3 tmax = max(near, far);

	float t0 = max( max(tmin.x, tmin.y), tmin.z);
	float t1 = min( min(tmax.x, tmax.y), tmax.z);

	if (t0 > t1) return INFINITY;
	if (t0 > 0.0) // if we are outside the box
	{
		normal = -sign(rayDirection) * step(tmin.yzx, tmin) * step(tmin.zxy, tmin);
		isRayExiting = false;
		return t0;
	}
	if (t1 > 0.0) // if we are inside the box
	{
		normal = -sign(rayDirection) * step(tmax, tmax.yzx) * step(tmax, tmax.zxy);
		isRayExiting = true;
		return t1;
	}
	return INFINITY;
}

//-------------------------------------------------------------------
// pathtracing_ellipsoid_intersect
//---------------------------------------------------------------------------------
float EllipsoidIntersect( vec3 radii, vec3 pos, vec3 rayOrigin, vec3 rayDirection )
//---------------------------------------------------------------------------------
{
	float t0, t1;
	vec3 oc = rayOrigin - pos;
	vec3 oc2 = oc*oc;
	vec3 ocrd = oc*rayDirection;
	vec3 rd2 = rayDirection*rayDirection;
	vec3 invRad = 1.0/radii;
	vec3 invRad2 = invRad*invRad;

	// quadratic equation coefficients
	float a = dot(rd2, invRad2);
	float b = 2.0*dot(ocrd, invRad2);
	float c = dot(oc2, invRad2) - 1.0;
	solveQuadratic(a, b, c, t0, t1);

	return t0 > 0.0 ? t0 : t1 > 0.0 ? t1 : INFINITY;
}

//-------------------------------------------------------------------
// pathtracing_opencylinder_intersect
//-------------------------------------------------------------------------------------------------------
float OpenCylinderIntersect( vec3 p0, vec3 p1, float rad, vec3 rayOrigin, vec3 rayDirection, out vec3 n )
//-------------------------------------------------------------------------------------------------------
{
	float r2=rad*rad;
	
	vec3 dp=p1-p0;
	vec3 dpt=dp/dot(dp,dp);
	
	vec3 ao=rayOrigin-p0;
	vec3 aoxab=cross(ao,dpt);
	vec3 vxab=cross(rayDirection,dpt);
	float ab2=dot(dpt,dpt);
	float a=2.0*dot(vxab,vxab);
	float ra=1.0/a;
	float b=2.0*dot(vxab,aoxab);
	float c=dot(aoxab,aoxab)-r2*ab2;
	
	float det=b*b-2.0*a*c;
	
	if (det<0.0) 
		return INFINITY;
	
	det=sqrt(det);
	
	float t0 = (-b-det)*ra;
	float t1 = (-b+det)*ra;
	
	vec3 ip;
	vec3 lp;
	float ct;
	if (t0 > 0.0)
	{
		ip=rayOrigin+rayDirection*t0;
		lp=ip-p0;
		ct=dot(lp,dpt);
		if((ct>0.0)&&(ct<1.0))
		{
			n=ip-(p0+dp*ct);
			return t0;
		}
	}
	
	if (t1 > 0.0)
	{
		ip=rayOrigin+rayDirection*t1;
		lp=ip-p0;
		ct=dot(lp,dpt);
		if((ct>0.0)&&(ct<1.0))
		{
		     	n=(p0+dp*ct)-ip;
			return t1;
		}
	}
	
	return INFINITY;
}

//-------------------------------------------------------------------
// pathtracing_cappedcylinder_intersect
//---------------------------------------------------------------------------------------------------------
float CappedCylinderIntersect( vec3 p0, vec3 p1, float rad, vec3 rayOrigin, vec3 rayDirection, out vec3 n )
//---------------------------------------------------------------------------------------------------------
{
	float r2=rad*rad;
	
	vec3 dp=p1-p0;
	vec3 dpt=dp/dot(dp,dp);
	
	vec3 ao=rayOrigin-p0;
	vec3 aoxab=cross(ao,dpt);
	vec3 vxab=cross(rayDirection,dpt);
	float ab2=dot(dpt,dpt);
	float a=2.0*dot(vxab,vxab);
	float ra=1.0/a;
	float b=2.0*dot(vxab,aoxab);
	float c=dot(aoxab,aoxab)-r2*ab2;
	
	float det=b*b-2.0*a*c;
	
	if(det<0.0)
		return INFINITY;
	
	det=sqrt(det);
	
	float t0=(-b-det)*ra;
	float t1=(-b+det)*ra;
	
	vec3 ip;
	vec3 lp;
	float ct;
	float result = INFINITY;
	
	// Cylinder caps
	// disk0
	vec3 diskNormal = normalize(dp);
	float denom = dot(diskNormal, rayDirection);
	vec3 pOrO = p0 - rayOrigin;
	float tDisk0 = dot(pOrO, diskNormal) / denom;
	if (tDisk0 > 0.0)
	{
		vec3 intersectPos = rayOrigin + rayDirection * tDisk0;
		vec3 v = intersectPos - p0;
		float d2 = dot(v,v);
		if (d2 <= r2)
		{
			result = tDisk0;
			n = diskNormal;
		}
	}
	
	// disk1
	denom = dot(diskNormal, rayDirection);
	pOrO = p1 - rayOrigin;
	float tDisk1 = dot(pOrO, diskNormal) / denom;
	if (tDisk1 > 0.0)
	{
		vec3 intersectPos = rayOrigin + rayDirection * tDisk1;
		vec3 v = intersectPos - p1;
		float d2 = dot(v,v);
		if (d2 <= r2 && tDisk1 < result)
		{
			result = tDisk1;
			n = diskNormal;
		}
	}
	
	// Cylinder body
	if (t1 > 0.0)
	{
		ip=rayOrigin+rayDirection*t1;
		lp=ip-p0;
		ct=dot(lp,dpt);
		if(ct>0.0 && ct<1.0 && t1<result)
		{
			result = t1;
		     	n=(p0+dp*ct)-ip;
		}
	}
	
	if (t0 > 0.0)
	{
		ip=rayOrigin+rayDirection*t0;
		lp=ip-p0;
		ct=dot(lp,dpt);
		if(ct>0.0 && ct<1.0 && t0<result)
		{
			result = t0;
			n=ip-(p0+dp*ct);
		}
	}
	
	return result;
}

//-------------------------------------------------------------------
// pathtracing_unit_bounding_sphere_intersect
float UnitBoundingSphereIntersect( vec3 ro, vec3 rd, out bool insideSphere )
{
	float t0, t1;
	float a = dot(rd, rd);
	float b = 2.0 * dot(rd, ro);
	float c = dot(ro, ro) - (1.01 * 1.01); // - (rad * rad) = - (1.0 * 1.0) = - 1.0 
	solveQuadratic(a, b, c, t0, t1);
	if (t0 > 0.0)
	{
		insideSphere = false;
		return t0;
	}
	if (t1 > 0.0)
	{
		insideSphere = true;
		return t1;
	}

	return INFINITY;
}

//-------------------------------------------------------------------
// pathtracing_sample_sphere_light
vec3 sampleSphereLight(vec3 x, vec3 nl, Sphere light, out float weight)
{
	vec3 dirToLight = (light.position - x); // no normalize (for distance calc below)
	float cos_alpha_max = sqrt(1.0 - clamp((light.radius * light.radius) / dot(dirToLight, dirToLight), 0.0, 1.0));
	float r0 = rng();
	float cos_alpha = 1.0 - r0 + r0 * cos_alpha_max;//mix( cos_alpha_max, 1.0, rng() );
	// * 0.75 below ensures shadow rays don't miss smaller sphere lights, due to shader float precision
	float sin_alpha = sqrt(max(0.0, 1.0 - cos_alpha * cos_alpha)) * 0.75; 
	float phi = rng() * TWO_PI;
	dirToLight = normalize(dirToLight);
	
	vec3 U = normalize( cross( abs(dirToLight.y) < 0.9 ? vec3(0, 1, 0) : vec3(0, 0, 1), dirToLight ) );
	vec3 V = cross(dirToLight, U);
	
	vec3 sampleDir = normalize(U * cos(phi) * sin_alpha + V * sin(phi) * sin_alpha + dirToLight * cos_alpha);
	weight = clamp(2.0 * (1.0 - cos_alpha_max) * max(0.0, dot(nl, sampleDir)), 0.0, 1.0);
	
	return sampleDir;
}