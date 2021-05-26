import { mat4, vec3 } from 'gl-matrix'

import {
  Mesh,
  Geometry,
  GeometryUtils,
  InstancedMesh,
  UNIFORM_TYPE_INT,
  UNIFORM_TYPE_VEC2,
  PerspectiveCamera,
  Texture,
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
  #instanceMatrix = mat4.create()
  #transformVec3 = vec3.create()

  #scaleZ = 1

  constructor(gl: WebGLRenderingContext, { idx, textureManager }) {
    this.#idx = idx
    this.#gl = gl
    this.#textureManager = textureManager

    this.#textTexture = new Texture(gl, {
      format: gl.RGB,
      minFilter: gl.LINEAR_MIPMAP_LINEAR,
      magFilter: gl.NEAREST,
    })

    const faces = GeometryUtils.createBoxSeparateFace({
      width: GRID_STEP_X,
      height: GRID_STEP_Y,
    })

    faces.forEach((side) => {
      const { orientation, vertices, normal, uv, indices } = side

      const totalCount = GRID_COUNT_X * GRID_COUNT_Y

      const instancedIndexes = new Float32Array(totalCount)

      for (let i = 0; i < totalCount; i++) {
        instancedIndexes[i] = i
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
      if (orientation === 'front') {
        mesh = new InstancedMesh(gl, {
          geometry,

          uniforms: {
            text: { type: UNIFORM_TYPE_INT, value: 0 },
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
        mesh.orientation = 'front'
      } else {
        mesh = new InstancedMesh(gl, {
          geometry,
          uniforms: {},
          defines: {},
          instanceCount: GRID_TOTAL_COUNT,
          vertexShaderSource: vertexShaderSource,
          fragmentShaderSource: fragmentShaderSource,
        })
      }

      this.#meshes.push(mesh)

      for (let x = 0; x < GRID_COUNT_X; x++) {
        for (let y = 0; y < GRID_COUNT_Y; y++) {
          const scalex = 1
          const scaley = 1
          const scalez = 1

          mat4.identity(this.#instanceMatrix)
          vec3.set(this.#transformVec3, scalex, scaley, scalez)
          mat4.scale(
            this.#instanceMatrix,
            this.#instanceMatrix,
            this.#transformVec3,
          )

          const posx = x * GRID_STEP_X - GRID_WIDTH_X / 2
          const posy = y * GRID_STEP_Y - GRID_WIDTH_Y / 2
          const posz = 1

          vec3.set(this.#transformVec3, posx, posy, posz)
          mat4.translate(
            this.#instanceMatrix,
            this.#instanceMatrix,
            this.#transformVec3,
          )
          const i = GRID_COUNT_X * x + y
          mesh.setMatrixAt(i, this.#instanceMatrix)
        }
      }
    })
  }

  resetScaleZ(): this {
    this.#scaleZ = 1
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
    const x = Math.round(hoveredIdx / GRID_COUNT_X)
    const y = GRID_COUNT_Y - (hoveredIdx % GRID_COUNT_Y)

    const hoveredItem = this.#viewDefinition.find(
      (item) => x >= item.x && x < item.x + item.value.length && item.y === y,
    )

    if (hoveredItem) {
      store.dispatch(setHoverItemStartX(hoveredItem.x))
      store.dispatch(setHoverItemEndX(hoveredItem.x + hoveredItem.value.length))
      store.dispatch(setHoverItemY(y))
      store.dispatch(setHoveredItem(hoveredItem.link))
      this.#scaleZ = 3
    } else {
      this.#scaleZ = 1
      store.dispatch(setHoveredItem(null))
      // store.dispatch(setHoverItemStartX(-1))
      // store.dispatch(setHoverItemEndX(-1))
      // store.dispatch(setHoverItemY(-1))
    }
  }

  render(camera: PerspectiveCamera): this {
    const { hoverItemStartX, hoverItemEndX, hoverItemY } = store.getState()
    for (let x = hoverItemStartX; x < hoverItemEndX; x++) {
      const y = GRID_COUNT_Y - hoverItemY - 1
      const i = GRID_COUNT_X * x + y
      mat4.identity(this.#instanceMatrix)
      const posx = x * GRID_STEP_X - GRID_WIDTH_X / 2
      const posy = y * GRID_STEP_Y - GRID_WIDTH_Y / 2
      const posz = 1

      vec3.set(this.#transformVec3, posx, posy, posz)
      mat4.translate(
        this.#instanceMatrix,
        this.#instanceMatrix,
        this.#transformVec3,
      )
      vec3.set(this.#transformVec3, 1, 1, this.#scaleZ)
      mat4.scale(
        this.#instanceMatrix,
        this.#instanceMatrix,
        this.#transformVec3,
      )
      this.#meshes.forEach((mesh) => {
        // @ts-ignore
        mesh.setMatrixAt(i, this.#instanceMatrix)
      })
    }

    this.#gl.activeTexture(this.#gl.TEXTURE0)
    this.#textTexture.bind()
    this.#meshes.forEach((mesh) => mesh.use().setCamera(camera).draw())
    this.#textTexture.unbind()
    return this
  }
}
