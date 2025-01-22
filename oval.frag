#version 330 compatibility

// you can set these 4 uniform variables dynamically or hardwire them:

uniform float	uKa, uKd, uKs;	    // coefficients of each type of lighting
uniform float	uShininess;	        // specular exponent

// in Project #1, these have to be set dynamically from glman sliders or keytime animations or by keyboard hits:
uniform float	uAd, uBd;           //diameters of oval, one side is longer than the other in an oval, so two values
uniform float	uTol;               //tolerance - for blending. 

// interpolated from the vertex shader:
in  vec2  vST;                  // texture coords
in  vec3  vN;                   // normal vector
in  vec3  vL;                   // vector from point to light
in  vec3  vE;                   // vector from point to eye
in  vec3  vMC;			        // model coordinates


const vec3 OBJECTCOLOR          = vec3(0.0, 0.1, 0.5);           // color to make the object MEOW
const vec3 ELLIPSECOLOR         = vec3(0.9, 0.0, 0.3);           // color to make the ellipse
const vec3 SPECULARCOLOR        = vec3( 1., 1., 1. );             // color of the specular light

void
main( )
{
    vec3 myColor = OBJECTCOLOR;
	vec2 st = vST;

	// blend OBJECTCOLOR and ELLIPSECOLOR by using the ellipse equation to decide how close
	// 	this fragment is to the ellipse border:


    //~FOR every fragment(every pixel) we ask this shader, "am I inside the patter or outside?" -> if inside, color it!

    //to find out where we are in the texture pattern (if at all)
    int numInS = int( st.s / uAd );     //num in S (jumps across the texture 0-1) -> where I am in s (st.s) / how many jumps to get here?)
	int numInT = int( st.t / uBd );     //num in T (jumps up and down the texture 0-1) -> where I am in t (st.t) / how many jumps to get here?)

    //dividing the diameter each way by 2 -> gives us the radius. uAd and uBd are set actively in GLMAN
    float aRadius = uAd / 2;              //radius calc 1 - ovals have differing diameter legnth, one way is longer than other, duh!
    float bRadius = uBd / 2;              //radius calc 2 - ^ 

    //finding the center of the current oval we're in
    float sCenter = numInS * uAd + aRadius;       //number over (numInS) * the diameter + the radius
    float tCenter = numInT * uBd + bRadius;       //number up/down (numInT) * the diameter + the radius

    //plug in everything to the equation to MAKE an ellipse. 
    float d = pow((st.s - sCenter) / aRadius, 2.0) + pow((st.t - tCenter) / bRadius, 2.0); 

    //use smoothstep to find d to plug in to the blend/mix function for blurring edges. 
	float t = smoothstep( 1.-uTol, 1.+uTol, d );          
    myColor = mix( ELLIPSECOLOR, OBJECTCOLOR, t );

	// now use myColor in the per-fragment lighting equations:

        vec3 Normal    = normalize(vN);
        vec3 Light     = normalize(vL);
        vec3 Eye       = normalize(vE);

        vec3 ambient = uKa * myColor;

        float dd = max( dot(Normal,Light), 0. );       // only do diffuse if the light can see the point
        vec3 diffuse = uKd * dd * myColor;

        float s = 0.;
        if( dd > 0. )              // only do specular if the light can see the point
        {
                vec3 ref = normalize(  reflect( -Light, Normal )  );
                float cosphi = dot( Eye, ref );
                if( cosphi > 0. )
                        s = pow( max( cosphi, 0. ), uShininess );
        }
        vec3 specular = uKs * s * SPECULARCOLOR.rgb;
        gl_FragColor = vec4( ambient + diffuse + specular,  1. );
}