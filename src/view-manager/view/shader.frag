precision highp float;

struct PointLightBase {
  float shininess;
  vec3 lightColor;
  vec3 specularColor;
  float specularFactor;
  vec3 worldPosition;
};

uniform PointLightBase PointLight;
uniform bool solidColor;
uniform sampler2D projectedShadowTexture;

#ifdef IS_FRONT_VIEW
  uniform sampler2D text;
#endif


varying vec2 v_uv;
varying vec4 v_projectedShadowUvs;
varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;
varying float v_shadedMixFactor;
varying float v_colorScaleFactor;

const float near_plane = 0.1;
const float far_plane = 1.0;

float LinearizeDepth(float depth) {
  float z = depth * 2.0 - 1.0; // Back to NDC 
  return (2.0 * near_plane * far_plane) / (far_plane + near_plane - z * (far_plane - near_plane));
}

void main () {
  if (solidColor) {
    gl_FragColor = vec4(1.0, 0.5, 0.5, 1.0);
  } else {
    vec3 normal = normalize(v_normal);
    vec3 lightDir = vec3(0.0, 3.0, 5.0);

    // Shadow
    // float shadowBias = -0.001;
    float shadowBias = -max(0.05 * (1.0 - dot(normal, lightDir)), 0.005);
    vec3 projectedTexcoord = v_projectedShadowUvs.xyz / v_projectedShadowUvs.w;
    float currentDepth = projectedTexcoord.z + shadowBias;

    float shadow = 0.0;
    vec2 texelSize = 1.0 / vec2(DEPTH_TEXTURE_WIDTH, DEPTH_TEXTURE_HEIGHT);
    
    #pragma unroll 5
    for(int x = -2; x <= 2; ++x) {
      #pragma unroll 5
        for(int y = -2; y <= 2; ++y) {
            float pcfDepth = texture2D(projectedShadowTexture, projectedTexcoord.xy + vec2(x, y) * texelSize).r; 
            shadow += currentDepth > pcfDepth ? 0.7 : 1.0;
        }    
    }
    shadow /= 25.0;

    // float shadow = (inRange && projectedDepth <= currentDepth) ? shadow : 1.0;

    // Point lighting
    vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
    vec3 surfaceToViewDirection = normalize(v_surfaceToView);

    vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
    float pointLight = dot(normal, surfaceToLightDirection);
    float specular = 0.0;

    if (pointLight > 0.0) {
      specular = pow(dot(normal, halfVector), PointLight.shininess);
    }
    
    #ifdef IS_FRONT_VIEW
      vec2 uv = vec2(v_uv.x, v_uv.y);
      // float textMixFactor = texture2D(text, uv);
      // float textMixFactor = 0.4;

      // gl_FragColor = vec4(
      //   vec3(currentDepth/40.0),
      //   1.0
      // );



      vec4 texColor = texture2D(text, uv);
      float textMixFactor = texColor.a;

      vec3 bgColor = vec3(1.0, 1.0, 1.0) * v_colorScaleFactor;

      vec4 textColor = mix(
        vec4(bgColor, 1.0),
        vec4(vec3(0.2), 1.0),
        textMixFactor
      );

      vec4 color = mix(texColor, textColor, v_shadedMixFactor);

      vec4 shadedColor = color;

      shadedColor.rgb *= pointLight * PointLight.lightColor;
      shadedColor.rgb += specular * PointLight.specularColor * PointLight.specularFactor;
      shadedColor.rgb *= shadow;

      gl_FragColor = mix(color, shadedColor, v_shadedMixFactor);

    #else
      // gl_FragColor = vec4(
      //   vec3(currentDepth/40.0),
      //   1.0
      // );

      gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    #endif

  }
}
