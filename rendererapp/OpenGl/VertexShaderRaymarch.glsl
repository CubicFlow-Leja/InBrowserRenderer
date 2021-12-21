precision mediump float;

attribute vec2 vertPosition;
attribute float MatrixIndex;

uniform mat4 CamFrustum;
varying vec3 RayDir;

uniform mat4 mWorld;

void main()
{
RayDir=CamFrustum[int(MatrixIndex)].xyz;
RayDir=normalize(RayDir);
RayDir=(mWorld*vec4(RayDir,0.0)).xyz;
gl_Position=vec4(vertPosition,0.0,1.0);
}