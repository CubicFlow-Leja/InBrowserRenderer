precision mediump float;
attribute vec2 vertPosition;
attribute float MatrixIndex;
uniform mat4 CamFrustum;
varying vec3 rayDir;
uniform mat4 mWorld;
 
void main()
{
    rayDir=CamFrustum[int(MatrixIndex)].xyz;
    rayDir=normalize(rayDir);
    rayDir=(mWorld*vec4(rayDir,0.0)).xyz;
    gl_Position=vec4(vertPosition,0.0,1.0);
}