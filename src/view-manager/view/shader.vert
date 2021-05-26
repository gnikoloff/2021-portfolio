uniform vec2 cellSize;

attribute vec4 position;
attribute mat4 instanceModelMatrix;
attribute vec2 uv;
attribute float instanceIndex;



#ifdef IS_FRONT_VIEW
  varying vec4 v_uv;  
#else
  varying vec2 v_uv;
#endif

void main () {
  gl_Position = projectionMatrix *
                viewMatrix *
                modelMatrix *
                instanceModelMatrix *
                position;

  #ifdef IS_FRONT_VIEW
    float texOffsetX = mod(instanceIndex, cellSize.x);
    float texOffsetY = (instanceIndex - texOffsetX) / cellSize.y;
    v_uv = vec4(
      uv *
      vec2(1.0 / cellSize.x) +
      vec2(texOffsetY / cellSize.x, texOffsetX / cellSize.y),
      uv
    );
  #else
    v_uv = uv;
  #endif
}
