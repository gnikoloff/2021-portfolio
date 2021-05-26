uniform vec2 cellSize;

attribute vec4 position;
attribute mat4 instanceModelMatrix;
attribute vec2 uv;
attribute float instanceIndex;

varying vec2 v_uv;

void main () {
  gl_Position = projectionMatrix *
                viewMatrix *
                modelMatrix *
                instanceModelMatrix *
                position;

  #ifdef IS_FRONT_VIEW
    float texOffsetX = mod(instanceIndex, cellSize.x);
    float texOffsetY = (instanceIndex - texOffsetX) / cellSize.y;
    v_uv = uv *
            vec2(1.0 / cellSize.x) +
            vec2(texOffsetY / cellSize.x, texOffsetX / cellSize.y);
  #else
    v_uv = uv;
  #endif
}
