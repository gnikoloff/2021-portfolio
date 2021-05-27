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
let a = 0
export default class View {
  #gl: WebGLRenderingContext
  #textTexture: Texture
  #textureManager: TextureManager
  #idx: number
  #viewDefinition

  #meshes: Array<Mesh> = []

  #instanceMatrix = mat4.create()
  #transformVec3 = vec3.create()

  #posZ = 0
  #isTweeningScaleZ = false
  #tweenForScaleZ
  #emptyTexture: Texture

  static posZInitial = 0
  static posZHover = GRID_STEP_Y * 0.9

  constructor(gl: WebGLRenderingContext, { idx, textureManager }) {
    this.#idx = idx
    this.#gl = gl
    this.#textureManager = textureManager

    this.#emptyTexture = new Texture(gl).bind().fromSize(1, 1)

    this.#textTexture = new Texture(gl, {
      format: gl.RGB,
      minFilter: gl.LINEAR_MIPMAP_LINEAR,
      magFilter: gl.NEAREST,
    })

    const faces = GeometryUtils.createRoundedBoxSeparateFace({
      width: GRID_STEP_X,
      height: GRID_STEP_Y,
      depth: GRID_STEP_Y,
      radius: 0.01,
    })

    faces.forEach((side) => {
      const { orientation, vertices, normal, uv, indices } = side

      const totalCount = GRID_COUNT_X * GRID_COUNT_Y

      const instancedIndexes = new Float32Array(totalCount)

      for (let i = 0; i < totalCount; i++) {
        instancedIndexes[i] = totalCount - i - 1
      }

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
        .addAttribute('instanceIndex', {
          size: 1,
          typedArray: instancedIndexes,
          instancedDivisor: 1,
        })

      let mesh
      if (orientation === CUBE_SIDE_FRONT) {
        mesh = new InstancedMesh(gl, {
          geometry,

          uniforms: {
            text: { type: UNIFORM_TYPE_INT, value: 0 },
            projectedShadowTexture: { type: UNIFORM_TYPE_INT, value: 1 },
            solidColor: { type: UNIFORM_TYPE_FLOAT, value: 1 },
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
            solidColor: { type: UNIFORM_TYPE_FLOAT, value: 1 },
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

  resetPosZ(): this {
    this.#posZ = View.posZInitial
    return this
  }

  setPosition(x = 0, y = 0, z = 0): this {
    this.#meshes.forEach((mesh) => {
      mesh.setPosition({ x, y, z })
    })
    return this
  }

  setView(viewDefiniton) {
    this.#viewDefinition = viewDefiniton
    const canvas = this.#textureManager.getTextureCanvas(
      this.#idx,
      viewDefiniton,
    )
    this.#textTexture.bind().setIsFlip().fromImage(canvas).generateMipmap()
    return this
  }

  setHoveredIdx(hoveredIdx: number) {
    const y = hoveredIdx % GRID_COUNT_Y
    const x = hoveredIdx / GRID_COUNT_X

    const hoveredItem = this.#viewDefinition.find(
      (item) =>
        x >= item.x &&
        x < item.x + item.value.length &&
        GRID_COUNT_Y - item.y - 1 === y,
    )

    if (hoveredItem && hoveredItem.link) {
      store.dispatch(setHoverItemStartX(hoveredItem.x - 1))
      store.dispatch(
        setHoverItemEndX(hoveredItem.x + hoveredItem.value.length - 1),
      )
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
            store.dispatch(setHoveredItem(null))
          },
        })
      }
    }
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
        const posx = x * GRID_STEP_X - GRID_WIDTH_X / 2
        const posy = y * GRID_STEP_Y - GRID_WIDTH_Y / 2
        let posz = 0

        if (x >= hoverItemStartX && x < hoverItemEndX && y === hoverItemY) {
          posz = this.#posZ
        }

        const scalex = 1
        const scaley = 1
        const scalez = 1

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

        const i = GRID_COUNT_X * x + y

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
        const isFront = i === 1
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
      mesh.use()
      mesh.setCamera(camera)
      mesh.setUniform('solidColor', UNIFORM_TYPE_FLOAT, renderAsSolidColor)
      mesh.draw()
    })
    // this.#textTexture.unbind()
    // if (shadowTexture) {
    //   this.#gl.activeTexture(this.#gl.TEXTURE1)
    //   shadowTexture.unbind()
    // }
    return this
  }
}
