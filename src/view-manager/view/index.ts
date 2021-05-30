import { mat4, ReadonlyMat4, vec3 } from 'gl-matrix'
import { animate } from 'popmotion'

import {
  Mesh,
  Geometry,
  GeometryUtils,
  InstancedMesh,
  PerspectiveCamera,
  Texture,
  UNIFORM_TYPE_INT,
  UNIFORM_TYPE_VEC2,
  CUBE_SIDE_FRONT,
  UNIFORM_TYPE_FLOAT,
  UNIFORM_TYPE_MATRIX4X4,
  UNIFORM_TYPE_VEC3,
  mapNumberRange,
  clamp,
} from '../../lib/hwoa-rang-gl/dist/esm'

import store from '../../store'
import {
  setHoverItemStartX,
  setHoverItemEndX,
  setHoverItemY,
  setHoveredItem,
} from '../../store/actions'

import {
  GRID_COUNT_X,
  GRID_COUNT_Y,
  GRID_STEP_X,
  GRID_STEP_Y,
  GRID_TOTAL_COUNT,
  GRID_WIDTH_X,
  GRID_WIDTH_Y,
} from '../../constants'

import vertexShaderSource from './shader.vert'
import fragmentShaderSource from './shader.frag'
import TextureManager from '../../texture-manager'

export default class View {
  #gl: WebGLRenderingContext
  #textTexture: Texture
  #textureManager: TextureManager
  #idx: number
  #viewDefinition

  #meshes: Array<Mesh> = []

  #positionsOffsets = new Float32Array(GRID_TOTAL_COUNT * 3).fill(0)
  #scaleOffsets = new Float32Array(GRID_TOTAL_COUNT).fill(0)

  #instanceMatrix = mat4.create()
  #transformVec3 = vec3.create()

  #posZ = 0
  #isTweeningScaleZ = false
  #tweenForScaleZ
  #emptyTexture: Texture

  static posZInitial = 0
  static posZHover = GRID_STEP_Y * 0.9
  static transitionDuration = 1000

  constructor(gl: WebGLRenderingContext, { idx, textureManager }) {
    this.#idx = idx
    this.#gl = gl
    this.#textureManager = textureManager

    this.#emptyTexture = new Texture(gl).bind().fromSize(1, 1)

    this.#textTexture = new Texture(gl, {
      format: gl.RGBA,
      minFilter: gl.LINEAR_MIPMAP_LINEAR,
      magFilter: gl.NEAREST,
    })

    const faces = GeometryUtils.createBoxSeparateFace({
      width: GRID_STEP_X,
      height: GRID_STEP_Y,
      depth: GRID_STEP_Y,
      radius: 0.01,
    })

    faces.forEach((side) => {
      const { orientation, vertices, normal, uv, indices } = side

      const geometry = new Geometry(gl)
        .addIndex({ typedArray: indices })
        .addAttribute('position', {
          size: 3,
          typedArray: vertices,
        })
        .addAttribute('uv', {
          size: 2,
          typedArray: uv,
        })
        .addAttribute('normal', {
          size: 3,
          typedArray: normal,
        })

      if (orientation === CUBE_SIDE_FRONT) {
        const instancedIndexes = new Float32Array(GRID_TOTAL_COUNT)
        const shadedMixFactors = new Float32Array(GRID_TOTAL_COUNT)
        const colorMixFactors = new Float32Array(GRID_TOTAL_COUNT)

        for (let i = 0; i < GRID_TOTAL_COUNT; i++) {
          instancedIndexes[i] = i
          shadedMixFactors[i] = 1
          colorMixFactors[i] = 0.925 + Math.random() * 0.075
        }
        geometry
          .addAttribute('instanceIndex', {
            size: 1,
            typedArray: instancedIndexes,
            instancedDivisor: 1,
          })
          .addAttribute('shadedMixFactor', {
            size: 1,
            typedArray: shadedMixFactors,
            instancedDivisor: 1,
          })
          .addAttribute('colorScaleFactor', {
            size: 1,
            typedArray: colorMixFactors,
            instancedDivisor: 1,
          })
      }

      let mesh

      const lightDirection = vec3.create()
      vec3.set(lightDirection, 0, 0, 10)
      vec3.normalize(lightDirection, lightDirection)

      const {
        cameraX,
        cameraY,
        cameraZ,
        lightX,
        lightY,
        lightZ,
        pointLightShininess,
        pointLightColor,
        pointLightSpecularColor,
        pointLightSpecularFactor,
      } = store.getState()

      const sharedUniforms = {
        solidColor: { type: UNIFORM_TYPE_FLOAT, value: 1 },
        eyePosition: {
          type: UNIFORM_TYPE_VEC3,
          value: [cameraX, cameraY, cameraZ],
        },
        'PointLight.worldPosition': {
          type: UNIFORM_TYPE_VEC3,
          value: [lightX, lightY, lightZ],
        },
        'PointLight.shininess': {
          type: UNIFORM_TYPE_FLOAT,
          value: pointLightShininess,
        },
        'PointLight.lightColor': {
          type: UNIFORM_TYPE_VEC3,
          value: pointLightColor,
        },
        'PointLight.specularColor': {
          type: UNIFORM_TYPE_VEC3,
          value: pointLightSpecularColor,
        },
        'PointLight.specularFactor': {
          type: UNIFORM_TYPE_FLOAT,
          value: pointLightSpecularFactor,
        },
      }

      if (orientation === CUBE_SIDE_FRONT) {
        mesh = new InstancedMesh(gl, {
          geometry,

          uniforms: {
            ...sharedUniforms,
            text: { type: UNIFORM_TYPE_INT, value: 0 },
            projectedShadowTexture: { type: UNIFORM_TYPE_INT, value: 1 },
            cellSize: {
              type: UNIFORM_TYPE_VEC2,
              value: [GRID_COUNT_X, GRID_COUNT_Y],
            },
          },
          defines: {
            IS_FRONT_VIEW: 1,
          },
          instanceCount: GRID_TOTAL_COUNT,
          vertexShaderSource: vertexShaderSource,
          fragmentShaderSource: fragmentShaderSource,
        })
      } else {
        mesh = new InstancedMesh(gl, {
          geometry,
          uniforms: {
            ...sharedUniforms,
            projectedShadowTexture: { type: UNIFORM_TYPE_INT, value: 0 },
          },
          defines: {},
          instanceCount: GRID_TOTAL_COUNT,
          vertexShaderSource: vertexShaderSource,
          fragmentShaderSource: fragmentShaderSource,
        })
      }

      this.#meshes.push(mesh)
    })
  }

  setPosition(x = 0, y = 0, z = 0): this {
    this.#meshes.forEach((mesh) => {
      mesh.setPosition({ x, y, z })
    })
    return this
  }

  transitionIn = () =>
    new Promise((resolve) => {
      const offsets = []
      for (let i = 0; i < GRID_TOTAL_COUNT; i++) {
        offsets[i] = Math.random()
      }
      animate({
        duration: View.transitionDuration,
        onUpdate: (v) => {
          for (let i = 0; i < GRID_TOTAL_COUNT; i++) {
            const offset = offsets[i]
            this.#positionsOffsets[i * 3 + 2] = clamp(
              mapNumberRange(v, offset, 1, -4, 0),
              -4,
              0,
            )
            this.#scaleOffsets[i] = v
          }
        },
        onComplete: () => resolve(null),
      })
    })

  transitionOut = () =>
    new Promise((resolve) => {
      const offsets = []
      for (let i = 0; i < GRID_TOTAL_COUNT; i++) {
        offsets[i] = Math.random()
      }
      animate({
        duration: View.transitionDuration,
        onUpdate: (v) => {
          for (let i = 0; i < GRID_TOTAL_COUNT; i++) {
            const offset = offsets[i]
            this.#positionsOffsets[i * 3 + 2] = clamp(
              mapNumberRange(v, offset, 1, 0, 4),
              0,
              4,
            )
            this.#scaleOffsets[i] = 1 - v
          }
        },
        onComplete: () => resolve(null),
      })
    })

  setView(viewDefiniton) {
    this.#viewDefinition = viewDefiniton

    const image = viewDefiniton.find(({ type }) => type === 'IMAGE')

    const shadedMixFactors = new Float32Array(GRID_TOTAL_COUNT)

    for (let i = 0; i < GRID_TOTAL_COUNT; i++) {
      if (image) {
        const y = GRID_COUNT_Y - (i % GRID_COUNT_Y) - 1
        const x = i / GRID_COUNT_X
        if (
          x >= image.x &&
          x < image.width &&
          y >= image.y &&
          y < image.height
        ) {
          shadedMixFactors[i] = 0
        } else {
          shadedMixFactors[i] = 1
        }
      } else {
        shadedMixFactors[i] = 1
      }
    }
    const frontMesh = this.#meshes[this.#meshes.length - 1]
    frontMesh.updateGeometryAttribute(
      'shadedMixFactor',
      0,
      GRID_TOTAL_COUNT,
      shadedMixFactors,
    )

    const canvas = this.#textureManager.getTextureCanvas(
      this.#idx,
      viewDefiniton,
    )
    this.#textTexture.bind().setIsFlip().fromImage(canvas).generateMipmap()
    return this
  }

  setHoveredIdx(hoveredIdx: number): string | null {
    const y = hoveredIdx % GRID_COUNT_Y
    const x = hoveredIdx / GRID_COUNT_X

    const hoveredItem = this.#viewDefinition.find(
      (item) =>
        x >= item.x &&
        x < item.x + item.value.length &&
        GRID_COUNT_Y - item.y - 1 === y,
    )

    if (hoveredItem && hoveredItem.link) {
      store.dispatch(setHoverItemStartX(hoveredItem.x))
      store.dispatch(setHoverItemEndX(hoveredItem.x + hoveredItem.value.length))
      store.dispatch(setHoverItemY(y))

      store.dispatch(setHoveredItem(hoveredItem.link))
      if (!this.#isTweeningScaleZ && this.#posZ === View.posZInitial) {
        this.#isTweeningScaleZ = true
        if (this.#tweenForScaleZ) {
          this.#tweenForScaleZ.stop()
        }
        this.#tweenForScaleZ = animate({
          duration: 100,
          onUpdate: (v) => {
            this.#posZ =
              View.posZInitial + v * (View.posZHover - View.posZInitial)
          },
          onComplete: () => {
            this.#isTweeningScaleZ = false
            this.#tweenForScaleZ = null
          },
        })
      }
    } else {
      if (!this.#isTweeningScaleZ && this.#posZ === View.posZHover) {
        this.#isTweeningScaleZ = true
        if (this.#tweenForScaleZ) {
          this.#tweenForScaleZ.stop()
        }
        this.#tweenForScaleZ = animate({
          duration: 100,
          onUpdate: (v) => {
            this.#posZ =
              View.posZHover - v * (View.posZHover - View.posZInitial)
          },
          onComplete: () => {
            this.#isTweeningScaleZ = false
            this.#tweenForScaleZ = null
            // store.dispatch(setHoveredItem(null))
          },
        })
      }
    }

    return hoveredItem && hoveredItem.link
  }

  setShadowTextureMatrix(shadowTextureMatrix: ReadonlyMat4) {
    this.#meshes.forEach((mesh) => {
      mesh
        .use()
        .setUniform(
          'shadowTextureMatrix',
          UNIFORM_TYPE_MATRIX4X4,
          shadowTextureMatrix,
        )
    })
  }

  updateMatrix() {
    const { hoverItemStartX, hoverItemEndX, hoverItemY } = store.getState()
    for (let x = 0; x < GRID_COUNT_X; x++) {
      for (let y = 0; y < GRID_COUNT_Y; y++) {
        const i = GRID_COUNT_X * x + y
        const posx =
          x * GRID_STEP_X -
          GRID_WIDTH_X / 2 +
          GRID_STEP_X / 2 +
          this.#positionsOffsets[i * 3 + 0]

        const posy =
          y * GRID_STEP_Y -
          GRID_WIDTH_Y / 2 +
          GRID_STEP_Y / 2 +
          this.#positionsOffsets[i * 3 + 1]

        let posz = 0 + this.#positionsOffsets[i * 3 + 2]

        if (x >= hoverItemStartX && x < hoverItemEndX && y === hoverItemY) {
          posz = this.#posZ + this.#positionsOffsets[i * 3 + 2]
        }

        const scalex = this.#scaleOffsets[i]
        const scaley = this.#scaleOffsets[i]
        const scalez = this.#scaleOffsets[i]
        // const scalez = Math.sqrt(posx * posx + posy * posy)

        mat4.identity(this.#instanceMatrix)

        vec3.set(this.#transformVec3, posx, posy, posz)
        mat4.translate(
          this.#instanceMatrix,
          this.#instanceMatrix,
          this.#transformVec3,
        )

        vec3.set(this.#transformVec3, scalex, scaley, scalez)
        mat4.scale(
          this.#instanceMatrix,
          this.#instanceMatrix,
          this.#transformVec3,
        )

        this.#meshes.forEach((mesh) =>
          // @ts-ignore
          mesh.setMatrixAt(i, this.#instanceMatrix),
        )
      }
    }
  }

  render(
    camera: PerspectiveCamera,
    renderAsSolidColor: boolean = false,
    shadowTexture: Texture = null,
  ): this {
    this.#meshes.forEach((mesh, i) => {
      if (shadowTexture) {
        const isFront = i === this.#meshes.length - 1
        if (isFront) {
          this.#gl.activeTexture(this.#gl.TEXTURE0)
          this.#textTexture.bind()

          this.#gl.activeTexture(this.#gl.TEXTURE1)
          shadowTexture.bind()
        } else {
          this.#gl.activeTexture(this.#gl.TEXTURE0)
          shadowTexture.bind()
        }
      } else {
        this.#gl.activeTexture(this.#gl.TEXTURE0)
        this.#emptyTexture.bind()
        this.#gl.activeTexture(this.#gl.TEXTURE1)
        this.#emptyTexture.bind()
      }
      mesh
        .use()
        .setCamera(camera)
        .setUniform('solidColor', UNIFORM_TYPE_FLOAT, renderAsSolidColor)
        .draw()
    })
    return this
  }
}
