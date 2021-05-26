precision highp float;

#ifdef IS_FRONT_VIEW
  uniform sampler2D text;
#endif

varying vec2 v_uv;

void main () {
  #ifdef IS_FRONT_VIEW
    float a = texture2D(text, v_uv).r;
    gl_FragColor = mix(
      vec4(1.0, 0.0, 1.0, 1.0),
      vec4(0.0, 1.0, 0.0, 1.0),
      a
    );
  #else
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  #endif
}
