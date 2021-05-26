precision highp float;

#ifdef IS_FRONT_VIEW
  uniform sampler2D text;
#endif

#ifdef IS_FRONT_VIEW
  varying vec4 v_uv;
#else
  varying vec2 v_uv;
#endif

void main () {
  #ifdef IS_FRONT_VIEW
    float borderWidth = 0.015;
    float aspect = 1.0;

    float maxX = 1.0 - borderWidth;
    float minX = borderWidth;
    float maxY = maxX / aspect;
    float minY = minX / aspect;

    vec2 globalUVs = v_uv.xy;
    vec2 localUVs = v_uv.zw;

    if (
      localUVs.x < maxX && localUVs.x > minX &&
      localUVs.y < maxY && localUVs.y > minY
    ) {
      float textMixFactor = texture2D(text, globalUVs).r;
      gl_FragColor = mix(
        vec4(1.0, 0.0, 1.0, 1.0),
        vec4(0.0, 1.0, 0.0, 1.0),
        textMixFactor
      );
    } else {
      gl_FragColor = vec4(vec3(0.4), 1.0);
    }
  #else
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  #endif
}
