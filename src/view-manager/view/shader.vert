struct PointLightBase {
  float shininess;
  vec3 lightColor;
  vec3 specularColor;
  float specularFactor;
  vec3 worldPosition;
};

uniform PointLightBase PointLight;
uniform vec2 cellSize;
uniform mat4 shadowTextureMatrix;
uniform vec3 eyePosition;

attribute vec4 position;
attribute vec2 uv;
attribute vec3 normal;
attribute mat4 instanceModelMatrix;
attribute float instanceIndex;
attribute float shadedMixFactor;

varying vec2 v_uv;
varying vec4 v_projectedShadowUvs;
varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;
varying float v_shadedMixFactor;

void main () {
  mat4 worldMatrix = modelMatrix * instanceModelMatrix;
  vec4 worldPosition = worldMatrix * position;

  gl_Position = projectionMatrix * viewMatrix * worldPosition;

  #ifdef IS_FRONT_VIEW
    float texOffsetY = mod(instanceIndex, cellSize.y);
    float texOffsetX = ceil(instanceIndex / cellSize.x) - 1.0;
    v_uv = uv *
           vec2(1.0 / cellSize.x, 1.0 / cellSize.y) +
           vec2(texOffsetX / cellSize.x, texOffsetY / cellSize.y);
  #else
    v_uv = uv;
  #endif

  v_normal = mat3(worldMatrix) * normal;
  v_projectedShadowUvs = shadowTextureMatrix * worldPosition;

  v_surfaceToLight = PointLight.worldPosition - worldPosition.xyz;
  v_surfaceToView = eyePosition - worldPosition.xyz;

  v_shadedMixFactor = shadedMixFactor;
}
