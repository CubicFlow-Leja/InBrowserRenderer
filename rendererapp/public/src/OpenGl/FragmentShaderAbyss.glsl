precision mediump float;

varying vec3 rayDir;
uniform float Time;
uniform vec3 CameraPosition;
uniform float Steps;

//STRUCTS
struct RayMarchData
{
    vec3 StartPos;
    vec3 Dir;
} RayData;

struct ReturnData
{
    vec4 Color;
} MarchReturnData;


//////OPERATORS
vec4 opU(vec4 d1,vec4 d2)
{
    if (d1.w < d2.w){return d1;}
    else{return d2;}
}

vec4 opS(vec4 d1,vec4 d2)
{
    if (d1.w < d2.w){return d1;}
    else{return d2;}
}

vec4 opI(vec4 d1,vec4 d2)
{
    if (d1.w > d2.w){ return d1;} 
    else{ return d2; }
} 


vec4 opUS(vec4 d1,vec4 d2 ,float k)
{
    float h = clamp(0.5 + 0.5 * (d2.w - d1.w) / k ,0.0 ,1.0);
    vec3 col = mix(d2.xyz, d1.xyz, h);
    float dist = mix(d2.w, d1.w, h) - k * h * (1.0 - h);
    return vec4(col, dist);
}

vec4 opSS(vec4 d1,vec4 d2 ,float k)
{
    float h = clamp(0.5 - 0.5 * (d2.w + d1.w) / k ,0.0 ,1.0);
    vec3 col = mix(d2.xyz, d1.xyz, h);
    float dist = mix(d2.w, -d1.w ,h) + k * h * (1.0 - h);
    return vec4(col, dist);
}

vec4 opIS(vec4 d1,vec4 d2, float k)
{
    float h = clamp(0.5 - 0.5 * (d2.w - d1.w) / k ,0.0 ,1.0);
    vec3 col = mix(d2.xyz, d1.xyz ,h);
    float dist = mix(d2.w ,d1.w, h) - k * h * (1.0 - h);
    return vec4(col, dist);
}

vec4 sdFractal(vec3 p,vec3 Color)
{
    float scale=0.002;
    vec3 g=p;
    vec3 colorParams=vec3(0.96, 0.95, 0.95);
    float _S=0.00001;
    for(int i=0; i<2; i++)
    {
		float x = abs(g.y) * abs(g.x) * abs(g.z) * 0.0001;
		float modulus = floor(x / (2.0 * 3.14));
		x -= modulus * 3.14;
		float x2 = x * x;
		float x3 = x2 * x;
		float x7 = x3 * x3 * x;

		float Sin = 1.0 +0.04 * (x - x3 / 6.0 + x3 * x2 / 120.0 - x7 / 5040.0);
		g = -1.0 + 2.0 * fract(0.5 * g * Sin +0.5);

        //turn into taylor series for better performance
		float gl = sqrt(g.x * g.x + g.y * g.y + g.z * g.z);

		float k = _S / (gl * gl);
		g *= k;
		scale *= k;
    }
    return vec4(Color * colorParams, abs(g.x) * abs(g.y) * abs(g.z) / scale);
}

////SDF
vec4 sdfBox(vec3 p,vec3 b,vec3 Color)
{
    vec3 q = abs(p) - b;
    float Len=length(max(q,vec3(0,0,0))) + min(max(q.x,max(q.y,q.z)),0.0);
    return vec4(Color, Len);
}

vec4 sdfSphere(vec3 p,vec3 Color)
{
    float radius=25.0;
    float len=length(p)-radius;
    return vec4(Color,  len);
}


vec3 Warp(vec3 p)
{
    float c = cos(p.y /500.0);
    float s = sin(p.y  / 500.0);
    mat2  m = mat2(c ,-s, s ,c);
    vec2 g = m*vec2(p.xz);
    vec3 F = vec3(g.x, p.y, g.y);
    return F;
}

vec3 Modulo(vec3 p, vec3 b)
{
    vec3 modulo=p-b*floor(p/abs(b))-0.5*b;
    return modulo;
}



vec4 SDFMAIN(vec3 p)
{
    // vec3 New=Warp(p);
    // vec3 ModTest=Modulo(p,vec3(75.0*(2.5+0.1*sin(Time*0.71+p.y/100.0)), 
    //             75.0*(2.5+0.05*sin(Time*0.361+p.z/100.0)),
    //             75.0*(2.5+0.07*cos(Time*0.51+p.x/100.0))));
    
    vec3 ModTest=Modulo(p,vec3(75.0*2.5, 
                        75.0*2.5,
                        75.0*2.5));

    // vec3 ModTest=Modulo(New,vec3(40,40,40));
    vec3 Color=vec3(0.5*abs(sin(Time*0.05+p.z/100.0)),
                   0.5*abs(sin(Time*0.01+p.x/100.0)),
                   0.5*abs(sin(Time*0.04+p.y/100.0)));

    //vec3 Color=vec3(0.27, 0, 1);
    //vec4 box= sdfBox(ModTest,vec3(20,20,20),Color);
    //vec4 Sphere=sdfSphere(ModTest,Color);
    //return opSS(Sphere,box,2.5);
    return sdfSphere(ModTest,Color);
}

//3D gradient -> a 3D normal is simply the result
//of a gradient on a 3D scalar field(the sdf functions)
vec3 calcNormal(vec3 p)
{
    const vec2 eps = vec2(0.0001, 0.0);
    vec3 nor = -vec3(SDFMAIN(p+eps.xyy).w-SDFMAIN(p-eps.xyy).w,
                     SDFMAIN(p+eps.yxy).w-SDFMAIN(p-eps.yxy).w,
                     SDFMAIN(p+eps.yyx).w-SDFMAIN(p-eps.yyx).w); 
    return normalize(nor);
}

float ShadowCasterPass(RayMarchData Data,float Steps,vec3 LightPos)
{
    vec3 pos=Data.StartPos;
    vec3 Dir=Data.Dir;
    vec3 p;

    float ShadowAtten=0.1;
    float t=25.0;
    float d=0.0;

    float Distance=length(LightPos-pos);

    float k=15.5;
    float Res=1.0;

    for (int i = 0; i <1200; i++) 
    {
        p=pos+Dir * t;
        d=SDFMAIN(p).w;
        t+=d;   
        Res=clamp( min(Res,d * k/t),ShadowAtten,1.0);
        if(d<=0.5)
            break;
            
        if (float(i)>=Steps || Distance-t<=0.5){
            ShadowAtten=Res;
            break;
        }
    }
    return ShadowAtten;
}

ReturnData ReflectionPass(RayMarchData Data,float Steps,vec3 LightPos)
{
    float a=Steps;
    vec3 pos=Data.StartPos;
    vec3 Dir=Data.Dir;
    float t=51.0;
    vec3 p;
    vec4 d;
    ReturnData RetData;
    RetData.Color=vec4(0.0,0.0,0.0,1.0);

    for (int i = 0; i <1200; i++)
    {
        if(float(i)>=a)
            break;

        p=pos+Dir * t;
        d=SDFMAIN(p);
        
        if(t>1000.0)
            break;

        if (d.w < 0.1){
            vec3 LightDir=normalize(p-LightPos);
            float LightDistFactor=clamp(1.0- length( p-LightPos)/1000.0,0.0,1.0);
            LightDistFactor=LightDistFactor * LightDistFactor;

            vec3 Normal=calcNormal(p);
            float DotProduct=(dot(Normal,LightDir)+1.0)/2.0;
            DotProduct=DotProduct * DotProduct * DotProduct * DotProduct;
            
            float SpecDot=(dot(-Dir,normalize(LightDir+ dot(-LightDir,Normal) * 2.0 * Normal))+1.0)/2.0;
            float Specular=(SpecDot * SpecDot * SpecDot * SpecDot) * 15.0+1.0;

            float DirectSpecularFactor=(dot(Normal,Dir)+1.0)/2.0;
            float DirectSpecular=5.5 * (DirectSpecularFactor * DirectSpecularFactor*DirectSpecularFactor * DirectSpecularFactor)+1.0;

            float Rim=clamp(5.5 * (1.0-DirectSpecularFactor * DirectSpecularFactor * DirectSpecularFactor * DirectSpecularFactor),1.0,1000.0);

            float LightAtten= DotProduct * LightDistFactor;
            LightAtten=clamp(LightAtten,0.0001,1.0);

            //shadowcast
            RayMarchData Data;
            Data.Dir=-LightDir;
            Data.StartPos=p;
            float ShadowAtten=(LightAtten>0.0) ? ShadowCasterPass(Data,Steps/2.0,LightPos) : 0.0;

            RetData.Color=vec4(d.xyz,1.0) * Specular * DirectSpecular * Rim * LightAtten * ShadowAtten;
            break;
        } 
        t+=d.w;
    }

    return RetData;
}

///RAYMARCH MAIN LOOP
ReturnData SphereMarch(RayMarchData Data,float Steps)
{
    float a=Steps;
    vec3 pos=Data.StartPos;
    vec3 Dir=Data.Dir;
    float t=0.0;
    vec3 p;
    vec4 d;
    ReturnData RetData;
    RetData.Color=vec4(0.0,0.0,0.0,0.0);

    vec3 LightPos= vec3(-255.0 * cos(Time * 0.45),
                        0,
                        255.0 * sin(Time * 0.45));

    for (int i = 0; i <1200; i++)
    {
        p=pos+Dir * t;
        d=SDFMAIN(p);

        if(t>8000.0)
            break;

        if(float(i)>=a)
            break;

        if (d.w < 0.1){
            vec3 LightDir=normalize(p-LightPos);
            float LightDistFactor=clamp(1.0- length( p-LightPos)/1000.0,0.0,1.0);
            LightDistFactor=LightDistFactor * LightDistFactor;

            vec3 Normal=calcNormal(p);
            float DotProduct=(dot(Normal,LightDir)+1.0)/2.0;
            DotProduct=DotProduct * DotProduct * DotProduct * DotProduct;

            float SpecDot=(dot(-Dir,normalize(LightDir+dot(-LightDir,Normal) * 2.0 * Normal))+1.0)/2.0;
            float Specular=(SpecDot * SpecDot * SpecDot * SpecDot) * 15.0+1.0;

            float DirectSpecularFactor=(dot(Normal,-Dir)+1.0)/2.0;
            float DirectSpecular=0.5 * (DirectSpecularFactor * DirectSpecularFactor * 
                                    DirectSpecularFactor * DirectSpecularFactor)+1.0;

            float Rim=clamp(2.5 * (1.0-DirectSpecularFactor * DirectSpecularFactor * 
                            DirectSpecularFactor * DirectSpecularFactor),1.0,1000.0);
    
            float LightAtten= DotProduct * LightDistFactor;
     
            //shadowcast
            RayMarchData Data;
            Data.Dir=-LightDir;
            Data.StartPos=p;
            float ShadowAtten=(LightAtten>0.0)?ShadowCasterPass(Data,Steps,LightPos):0.0;

            RayMarchData DataReflection;
            DataReflection.Dir=Dir+dot(Dir,Normal)*2.0*Normal;
            DataReflection.StartPos=p;
            ReturnData RETURNREF;
            RETURNREF.Color=(LightAtten>0.0)?ReflectionPass(DataReflection,Steps,LightPos).Color:vec4(0.0,0.0,0.0,1.0);
            
            vec4 Color;
            Color=vec4(d.xyz,1.0) * 0.75+RETURNREF.Color * 0.75;
            RetData.Color=Color * Specular * LightAtten * DirectSpecular * Rim * ShadowAtten;
            break;
        } 
        t+=d.w;
    }
    return RetData;
}



//frag shader
void main()
{
    vec3 rd = rayDir;
    vec3 ro=CameraPosition;

    RayMarchData Data;
    Data.Dir=rd;
    Data.StartPos=ro;

    ReturnData RETURN;
    RETURN=SphereMarch(Data,Steps);
  
    gl_FragColor=vec4(RETURN.Color);
}


