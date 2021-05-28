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
    // Shadow
    float shadowBias = -0.001;
    vec3 projectedTexcoord = v_projectedShadowUvs.xyz / v_projectedShadowUvs.w;
    float currentDepth = projectedTexcoord.z + shadowBias;

    bool inRange = 
        projectedTexcoord.x >= 0.0 &&
        projectedTexcoord.x < 1.0 &&
        projectedTexcoord.y >= 0.0 &&
        projectedTexcoord.y < 1.0;

    float projectedDepth = texture2D(projectedShadowTexture, projectedTexcoord.xy).r;
    float shadowLight = (inRange && projectedDepth <= currentDepth) ? 0.6 : 1.0; 

    // Point lighting
    vec3 normal = normalize(v_normal);
    vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
    vec3 surfaceToViewDirection = normalize(v_surfaceToView);

    vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
    float pointLight = dot(normal, surfaceToLightDirection);
    float specular = 0.0;

    if (pointLight > 0.0) {
      specular = pow(dot(normal, halfVector), PointLight.shininess);
    }
    
    #ifdef IS_FRONT_VIEW
      vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
      float textMixFactor = texture2D(text, uv).a;
      // float textMixFactor = 0.4;

      // gl_FragColor = vec4(
      //   vec3(currentDepth/40.0),
      //   1.0
      // );

      gl_FragColor = mix(
        vec4(1.0, 1.0, 1.0, 1.0),
        vec4(0.2, 0.2, 0.2, 1.0),
        textMixFactor
      );
    #else
      // gl_FragColor = vec4(
      //   vec3(currentDepth/40.0),
      //   1.0
      // );

      gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    #endif

    gl_FragColor.rgb *= pointLight * PointLight.lightColor;
    gl_FragColor.rgb += specular * PointLight.specularColor * PointLight.specularFactor;
    gl_FragColor.rgb *= shadowLight;
  }
}
