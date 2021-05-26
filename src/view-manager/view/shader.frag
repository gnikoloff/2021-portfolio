precision highp float;

#ifdef IS_FRONT_VIEW
  uniform sampler2D text;
#endif

varying vec2 v_uv;

void main () {
  #ifdef IS_FRONT_VIEW
    gl_FragColor = texture2D(text, v_uv);
  #else
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  #endif
}
