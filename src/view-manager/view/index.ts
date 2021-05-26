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
  #viewDefinition

  #meshes: Array<Mesh> = []
  #instanceMatrix = mat4.create()
  #transformVec3 = vec3.create()

  #hoverItemStartX = -1
  #hoverItemEndX = -1
  #hoverItemY = -1
  #scaleZ = 1

  constructor(gl: WebGLRenderingContext, { textureManager }) {
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

  setView(viewDefiniton) {
    this.#viewDefinition = viewDefiniton
    this.#textureManager.setActiveView(viewDefiniton)
    const canvas = this.#textureManager.getActiveCanvas()
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
      this.#hoverItemStartX = hoveredItem.x
      this.#hoverItemEndX = hoveredItem.x + hoveredItem.value.length
      this.#hoverItemY = y
      this.#scaleZ = 2
    } else {
      this.#scaleZ = 1
      // this.#hoverItemStartX = -1
      // this.#hoverItemEndX = -1
      // this.#hoverItemY = -1
    }
  }

  render(camera: PerspectiveCamera): this {
    for (let x = this.#hoverItemStartX; x < this.#hoverItemEndX; x++) {
      const y = GRID_COUNT_Y - this.#hoverItemY - 1
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
    // for (let i = this.#hoverItemStartIdx; i < this.#hoverItemEndIdx; i++) {
    //   const x = Math.round(i / GRID_COUNT_X)
    //   const y = i % GRID_COUNT_Y
    //
    // }

    this.#gl.activeTexture(this.#gl.TEXTURE0)
    this.#textTexture.bind()
    this.#meshes.forEach((mesh) => mesh.use().setCamera(camera).draw())
    this.#textTexture.unbind()
    return this
  }
}
