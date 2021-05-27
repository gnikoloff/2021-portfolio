uniform vec2 cellSize;
uniform mat4 shadowTextureMatrix;

attribute vec4 position;
attribute mat4 instanceModelMatrix;
attribute vec2 uv;
attribute float instanceIndex;

varying vec2 v_uv;
varying vec4 v_projectedShadowUvs;

void main () {
  vec4 worldPosition = modelMatrix * instanceModelMatrix * position;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;

  #ifdef IS_FRONT_VIEW
    float texOffsetY = mod(instanceIndex, cellSize.y);
    float texOffsetX = cellSize.x - (instanceIndex - texOffsetY) / cellSize.x;
    v_uv = uv *
           vec2(1.0 / cellSize.x, 1.0 / cellSize.y) +
           vec2(texOffsetX / cellSize.x, texOffsetY / cellSize.y);
  #else
    v_uv = uv;
  #endif

  v_projectedShadowUvs = shadowTextureMatrix * worldPosition;
}
