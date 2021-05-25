import { vec3, mat4 } from 'gl-matrix'
import {
  CameraController,
  Geometry,
  GeometryUtils,
  InstancedMesh,
  Mesh,
  Texture,
  PerspectiveCamera,
  UNIFORM_TYPE_INT,
  UNIFORM_TYPE_VEC2,
} from './lib/hwoa-rang-gl/dist/esm'

import VIEWS_DEFINITIONS from './VIEWS_DEFINITIONS.json'

import TextureManager from './texture-manager'

import './index.css'

const COUNT_X = 15
const COUNT_Y = 15
const TOTAL_COUNT = COUNT_X * COUNT_Y
const WIDTH_X = 10
const WIDTH_Y = 10

const stepX = WIDTH_X / COUNT_X
const stepY = WIDTH_Y / COUNT_Y

const canvas = document.createElement('canvas')
const gl = canvas.getContext('webgl')

const dpr = Math.min(2.5, devicePixelRatio)
canvas.width = innerWidth * dpr
canvas.height = innerHeight * dpr
canvas.style.setProperty('width', `${innerWidth}px`)
canvas.style.setProperty('height', `${innerHeight}px`)
document.body.appendChild(canvas)

const camera = new PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000)
camera.position = [0, 0, 10]
camera.lookAt([0, 0, 0])
new CameraController(camera)

const texManager = new TextureManager({
  cellsCountX: COUNT_X,
  cellsCountY: COUNT_Y,
  idealFontSize: 110,
  maxSize: Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), 2048),
})
  .showDebug(0.1)
  .setActiveView(VIEWS_DEFINITIONS['home'])

const viewCanvas = texManager.getActiveCanvas()
const texture = new Texture(gl, {
  format: gl.RGB,
  minFilter: gl.LINEAR_MIPMAP_LINEAR,
  magFilter: gl.NEAREST,
})
  .bind()
  .setIsFlip()
  .fromImage(viewCanvas)
  .generateMipmap()

const vShader = `
  uniform vec2 cellSize;

  attribute vec4 position;
  attribute mat4 instanceModelMatrix;
  attribute vec2 uv;
  attribute float instanceIndex;

  varying vec2 v_uv;

  void main () {
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceModelMatrix * position;

    float texOffsetX = mod(instanceIndex, cellSize.x);
    float texOffsetY = (instanceIndex - texOffsetX) / cellSize.y;

    v_uv = uv *
           vec2(1.0 / cellSize.x) +
           vec2(texOffsetY / cellSize.x, texOffsetX / cellSize.y);
  }
`

const fShader = `
  precision highp float;

  void main () {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  }
`

const fShaderFront = `
  precision highp float;

  uniform sampler2D text;

  varying vec2 v_uv;

  void main () {
    gl_FragColor = texture2D(text, v_uv);
  }
`

const mat = mat4.create()
const transform = vec3.create()

const meshes: Array<Mesh> = []

const faces = GeometryUtils.createBoxSeparateFace({
  width: stepX,
  height: stepY,
  separateFaces: true,
})

faces.forEach((side) => {
  const { orientation, vertices, normal, uv, indices } = side

  const totalCount = COUNT_X * COUNT_Y

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
        cellSize: { type: UNIFORM_TYPE_VEC2, value: [COUNT_X, COUNT_Y] },
      },
      defines: {},
      instanceCount: TOTAL_COUNT,
      vertexShaderSource: vShader,
      fragmentShaderSource: fShaderFront,
    })
    mesh.orientation = 'front'
  } else {
    mesh = new InstancedMesh(gl, {
      geometry,
      uniforms: {},
      defines: {},
      instanceCount: TOTAL_COUNT,
      vertexShaderSource: vShader,
      fragmentShaderSource: fShader,
    })
  }

  meshes.push(mesh)

  for (let x = 0; x < COUNT_X; x++) {
    for (let y = 0; y < COUNT_Y; y++) {
      const scalex = 1
      const scaley = 1
      const scalez = 1

      mat4.identity(mat)
      vec3.set(transform, scalex, scaley, scalez)
      mat4.scale(mat, mat, transform)

      const posx = x * stepX - WIDTH_X / 2
      const posy = y * stepY - WIDTH_Y / 2
      const posz = 1

      vec3.set(transform, posx, posy, posz)
      mat4.translate(mat, mat, transform)
      const i = COUNT_X * x + y
      mesh.setMatrixAt(i, mat)
    }
  }
})

requestAnimationFrame(updateFrame)
function updateFrame(ts) {
  if (!gl) {
    return
  }

  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
  gl.enable(gl.DEPTH_TEST)
  gl.clearColor(0.2, 0.2, 0.2, 1)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  texture.bind()
  meshes.forEach((mesh) => mesh.use().setCamera(camera).draw())
  texture.unbind()

  requestAnimationFrame(updateFrame)
}
