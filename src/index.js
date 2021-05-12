import { vec3, mat4 } from 'gl-matrix'
import {
  CameraController,
  Geometry,
  GeometryUtils,
  InstancedMesh,
  Mesh,
  PerspectiveCamera,
} from './hwoa-rang-gl/dist/esm'

import './index.css'

const canvas = document.createElement('canvas')
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

const dpr = Math.min(2.5, devicePixelRatio)
canvas.width = innerWidth * dpr
canvas.height = innerHeight * dpr
canvas.style.setProperty('width', innerWidth)
canvas.style.setProperty('height', innerHeight)
document.body.appendChild(canvas)

const camera = new PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000)
camera.position = [0, 0, 10]
camera.lookAt([0, 0, 0])
const cameraController = new CameraController(camera)

const vShader = `
  attribute vec4 position;
  attribute mat4 instanceModelMatrix;

  void main () {
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceModelMatrix * position;
  }
`

const fShader = `
  precision highp float;

  void main () {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  }
`
const mat = mat4.create()
const transform = vec3.create()

const meshes = []

GeometryUtils.createBox({
  separateFaces: true,
}).forEach((side) => {
  const { orientation, vertices, normal, uv, indices } = side
  const geometry = new Geometry(gl)
    .addIndex({ typedArray: indices })
    .addAttribute('position', {
      size: 3,
      typedArray: vertices,
    })
  let mesh
  if (orientation === 'front') {
    mesh = new InstancedMesh(gl, {
      geometry,
      instanceCount: 4,
      vertexShaderSource: vShader,
      fragmentShaderSource: fShader,
    })
    mesh.orientation = 'front'
  } else {
    mesh = new InstancedMesh(gl, {
      geometry,
      instanceCount: 4,
      vertexShaderSource: vShader,
      fragmentShaderSource: fShader,
    })
  }
  meshes.push(mesh)
  for (let i = 0; i < 4; i++) {
    vec3.set(transform, i * 2, 0, 0)
    mat4.identity(mat)
    mat4.translate(mat, mat, transform)
    mesh.setMatrixAt(i, mat)
  }
})

requestAnimationFrame(updateFrame)
function updateFrame(ts) {
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
  gl.enable(gl.DEPTH_TEST)
  gl.clearColor(0.2, 0.2, 0.2, 1)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  meshes.forEach((mesh) => mesh.use().setCamera(camera).draw())

  requestAnimationFrame(updateFrame)
}
