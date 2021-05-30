import { mat4, vec3 } from 'gl-matrix'
import { GRID_STEP_X, GRID_STEP_Y } from './constants'
import {
  Geometry,
  GeometryUtils,
  InstancedMesh,
  PerspectiveCamera,
  UNIFORM_TYPE_FLOAT,
  UNIFORM_TYPE_VEC3,
} from './lib/hwoa-rang-gl/dist/esm'
import store from './store'

export default class LoadingScreen {
  #mesh: InstancedMesh

  #matrix = mat4.create()
  #transformVec = vec3.create()

  #loadProgress = 0
  #visibilityThreshold = 0

  static CUBES_COUNT = 20
  static TOTAL_WIDTH = LoadingScreen.CUBES_COUNT * GRID_STEP_X

  constructor(gl: WebGLRenderingContext) {
    const { vertices, normal, indices } = GeometryUtils.createBox({
      width: GRID_STEP_X,
      height: GRID_STEP_Y,
      depth: GRID_STEP_Y,
    })
    const geometry = new Geometry(gl)

    const colorScaleFactors = new Float32Array(LoadingScreen.CUBES_COUNT)
    for (let i = 0; i < LoadingScreen.CUBES_COUNT; i++) {
      colorScaleFactors[i] = 0.825 + Math.random() * 0.175
    }

    geometry
      .addIndex({ typedArray: indices })
      .addAttribute('position', {
        typedArray: vertices,
        size: 3,
      })
      .addAttribute('normal', {
        typedArray: normal,
        size: 3,
      })
      .addAttribute('colorScaleFactor', {
        typedArray: colorScaleFactors,
        size: 1,
        instancedDivisor: 1,
      })

    this.#mesh = new InstancedMesh(gl, {
      geometry,
      instanceCount: LoadingScreen.CUBES_COUNT,
      uniforms: {
        lightDirection: { type: UNIFORM_TYPE_VEC3, value: [-4, 3, 3] },
        lightFactor: { type: UNIFORM_TYPE_FLOAT, value: 0.4 },
      },
      defines: {},
      vertexShaderSource: `
        attribute vec4 position;
        attribute vec3 normal;
        attribute mat4 instanceModelMatrix;
        attribute float colorScaleFactor;

        varying float v_colorScaleFactor;
        varying vec3 v_normal;

        void main () {
          vec4 worldPosition = modelMatrix * instanceModelMatrix * position;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
          
          v_colorScaleFactor = colorScaleFactor;
          v_normal = mat3(modelMatrix) * normal;
        }
      `,
      fragmentShaderSource: `
        precision highp float;

        uniform vec3 lightDirection;
        uniform float lightFactor;

        varying vec3 v_normal;
        varying float v_colorScaleFactor;

        void main() {
          vec3 normal = normalize(v_normal);
          float light = dot(normal, lightDirection);
          gl_FragColor = vec4(
            vec3(0.6) * v_colorScaleFactor * light * lightFactor,
            1.0
          );
        }
      `,
    })

    for (let i = 0; i < LoadingScreen.CUBES_COUNT; i++) {
      mat4.identity(this.#matrix)
      vec3.set(
        this.#transformVec,
        i * GRID_STEP_X - LoadingScreen.TOTAL_WIDTH / 2,
        0,
        0,
      )
      mat4.translate(this.#matrix, this.#matrix, this.#transformVec)
      vec3.set(this.#transformVec, 0, 0, 0)
      mat4.scale(this.#matrix, this.#matrix, this.#transformVec)
      // @ts-ignore
      this.#mesh.setMatrixAt(i, this.#matrix)
    }

    store.subscribe(this.onGlobalStoreChange)
  }

  render(camera: PerspectiveCamera) {
    const state = store.getState()
    const { hasLoadedResources } = state
    if (!hasLoadedResources) {
      this.#mesh.use().setCamera(camera).draw()
    }
  }

  onGlobalStoreChange = () => {
    const state = store.getState()
    const { loadedResourcesPercentage } = state
    if (this.#loadProgress !== loadedResourcesPercentage) {
      const visibilityThreshold = Math.round(
        loadedResourcesPercentage * LoadingScreen.CUBES_COUNT,
      )
      for (let i = this.#visibilityThreshold; i < visibilityThreshold; i++) {
        mat4.identity(this.#matrix)
        vec3.set(
          this.#transformVec,
          i * GRID_STEP_X - LoadingScreen.TOTAL_WIDTH / 2,
          0,
          0,
        )
        mat4.translate(this.#matrix, this.#matrix, this.#transformVec)
        vec3.set(this.#transformVec, 1, 1, 1)
        mat4.scale(this.#matrix, this.#matrix, this.#transformVec)
        // @ts-ignore
        this.#mesh.setMatrixAt(i, this.#matrix)
      }
      this.#visibilityThreshold = visibilityThreshold
      this.#loadProgress = loadedResourcesPercentage
    }
  }
}