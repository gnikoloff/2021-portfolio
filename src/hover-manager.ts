import { mat4, ReadonlyMat4, vec3 } from 'gl-matrix'
import {
  GRID_COUNT_X,
  GRID_COUNT_Y,
  GRID_STEP_X,
  GRID_STEP_Y,
  GRID_TOTAL_COUNT,
  GRID_WIDTH_X,
  GRID_WIDTH_Y,
} from './constants'

import {
  Framebuffer,
  Geometry,
  GeometryUtils,
  InstancedMesh,
  PerspectiveCamera,
  PROJECTION_MATRIX_UNIFORM_NAME,
  UNIFORM_TYPE_MATRIX4X4,
} from './lib/hwoa-rang-gl/dist/esm/index'
import store from './store'
import { setHoverIdx } from './store/actions'

export default class HoverManager {
  #gl: WebGLRenderingContext
  #mesh: InstancedMesh
  #mousepickFramebuffer: Framebuffer

  #instanceMatrix = mat4.create()
  #transformVec3 = vec3.create()
  #frustumProjectionMatrix = mat4.create()

  constructor(gl: WebGLRenderingContext, {}) {
    this.#gl = gl

    const { vertices, indices } = GeometryUtils.createBox({
      width: GRID_STEP_X,
      height: GRID_STEP_Y,
    })
    const geometry = new Geometry(gl)

    const hoverIds = new Float32Array(GRID_TOTAL_COUNT * 4)

    for (let i = 0; i < GRID_TOTAL_COUNT; i++) {
      hoverIds[i * 4 + 0] = (((i + 1) >> 0) & 0xff) / 0xff
      hoverIds[i * 4 + 1] = (((i + 1) >> 8) & 0xff) / 0xff
      hoverIds[i * 4 + 2] = (((i + 1) >> 16) & 0xff) / 0xff
      hoverIds[i * 4 + 3] = (((i + 1) >> 24) & 0xff) / 0xff
    }

    geometry
      .addIndex({ typedArray: indices })
      .addAttribute('position', {
        typedArray: vertices,
        size: 3,
      })
      .addAttribute('id', {
        typedArray: hoverIds,
        size: 4,
        instancedDivisor: 1,
      })

    this.#mesh = new InstancedMesh(gl, {
      instanceCount: GRID_TOTAL_COUNT,
      uniforms: {},
      defines: {},
      geometry,
      vertexShaderSource: `
        attribute vec4 position;
        attribute vec4 id;
        attribute mat4 instanceModelMatrix;

        varying vec4 v_id;

        void main () {
          gl_Position = projectionMatrix *
                        viewMatrix *
                        modelMatrix *
                        instanceModelMatrix *
                        position;

          v_id = id;
        }
      `,
      fragmentShaderSource: `
        varying vec4 v_id;
       
        void main () {
          gl_FragColor = v_id;
        }
      `,
    })

    for (let x = 0; x < GRID_COUNT_X; x++) {
      for (let y = 0; y < GRID_COUNT_Y; y++) {
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
        // @ts-ignore
        this.#mesh.setMatrixAt(i, this.#instanceMatrix)
      }
    }

    this.#mousepickFramebuffer = new Framebuffer(gl, {
      width: innerWidth * 0.5,
      height: innerHeight * 0.5,
    })
  }

  determineHoveredIdx(
    camera: PerspectiveCamera,
    mouseX: number,
    mouseY: number,
  ) {
    const { fieldOfView, near, far } = camera

    const gl = this.#gl

    const aspect = gl.canvas.width / gl.canvas.height
    const top = Math.tan(fieldOfView * 0.5) * near
    const bottom = -top
    const left = aspect * bottom
    const right = aspect * top
    const width = Math.abs(right - left)
    const height = Math.abs(top - bottom)

    const pixelX = (mouseX * gl.canvas.width) / gl.canvas.height
    const pixelY =
      innerHeight - (mouseY * gl.canvas.height) / gl.canvas.height - 1

    const subLeft = left + (pixelX * width) / gl.canvas.width
    const subBottom = bottom + (pixelY * height) / gl.canvas.height
    const subWidth = 1 / gl.canvas.width
    const subHeight = 1 / gl.canvas.height

    // make a frustum for that 1 pixel
    mat4.frustum(
      this.#frustumProjectionMatrix,
      subLeft,
      subLeft + subWidth,
      subBottom,
      subBottom + subHeight,
      near,
      far,
    )

    this.#mousepickFramebuffer.bind()

    gl.viewport(0, 0, 1, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    this.#mesh
      .use()
      .setCamera(camera)
      .setUniform(
        PROJECTION_MATRIX_UNIFORM_NAME,
        UNIFORM_TYPE_MATRIX4X4,
        this.#frustumProjectionMatrix,
      )
      .draw()

    const pixelData = new Uint8Array(4)
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelData)

    const id =
      pixelData[0] +
      (pixelData[1] << 8) +
      (pixelData[2] << 16) +
      (pixelData[3] << 24)

    this.#mousepickFramebuffer.unbind()

    let pickNdx = -1

    if (id > 0) {
      pickNdx = id - 1
    }

    store.dispatch(setHoverIdx(pickNdx))
  }

  render(camera: PerspectiveCamera) {}
}
