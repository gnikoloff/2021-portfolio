import {
  CameraController,
  Framebuffer,
  Geometry,
  GeometryUtils,
  Mesh,
  OrthographicCamera,
  PerspectiveCamera,
  UNIFORM_TYPE_INT,
} from './lib/hwoa-rang-gl/dist/esm'

import store from './store'
import { setActiveView } from './store/actions'

import VIEWS_DEFINITIONS from './VIEWS_DEFINITIONS.json'

import ViewManager from './view-manager'
import HoverManager from './hover-manager'
import LightingManager from './lighting-manager'

import './index.css'
import { mat4, vec3 } from 'gl-matrix'

const DEPTH_TEXTURE_WIDTH = 512
const DEPTH_TEXTURE_HEIGHT = 512

store.dispatch(setActiveView('home'))

const dpr = Math.min(2.5, devicePixelRatio)
const mousePosition = { x: -1000, y: -1000 }
const canvas = document.createElement('canvas')
const gl = canvas.getContext('webgl')

const hoverManager = new HoverManager(gl, {})
const viewManager = new ViewManager(gl)

const depthFramebuffer = new Framebuffer(gl, {
  width: DEPTH_TEXTURE_WIDTH,
  height: DEPTH_TEXTURE_HEIGHT,
  useDepthRenderBuffer: false,
})

canvas.width = innerWidth * dpr
canvas.height = innerHeight * dpr
canvas.style.setProperty('width', `${innerWidth}px`)
canvas.style.setProperty('height', `${innerHeight}px`)
document.body.appendChild(canvas)

const camera = new PerspectiveCamera(
  (45 * Math.PI) / 180,
  innerWidth / innerHeight,
  0.1,
  100,
)
camera.position = [0, 0, 25]
camera.lookAt([0, 0, 0])

const lightingManager = new LightingManager({
  position: [0, 5, 5],
  lookAt: [0, 0, 0],
})

const shadowTextureMatrix = lightingManager.getShadowTextureMatrix()

viewManager.setShadowTextureMatrix(shadowTextureMatrix)

const orthoCamera = new OrthographicCamera(
  -innerWidth / 2,
  innerWidth / 2,
  innerHeight / 2,
  -innerHeight / 2,
  0.1,
  4,
)
orthoCamera.position = [0, 0, 2]
orthoCamera.lookAt([0, 0, 0])

let depthDebugMesh
{
  const width = innerWidth * 0.2
  const height = innerHeight * 0.2
  const { indices, vertices, uv } = GeometryUtils.createPlane({
    width,
    height,
  })
  const geometry = new Geometry(gl)
    .addIndex({ typedArray: indices })
    .addAttribute('position', { typedArray: vertices, size: 3 })
    .addAttribute('uv', { typedArray: uv, size: 2 })
  depthDebugMesh = new Mesh(gl, {
    geometry,
    uniforms: {
      depthTex: { type: UNIFORM_TYPE_INT, value: 0 },
    },
    vertexShaderSource: `
      attribute vec4 position;
      attribute vec2 uv;

      varying vec2 v_uv;

      void main () {
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * position;

        v_uv = uv;
      }
    `,
    fragmentShaderSource: `
      precision highp float;

      uniform sampler2D depthTex;

      varying vec2 v_uv;

      const float near_plane = ${lightingManager.shadowNear};
      const float far_plane = ${lightingManager.shadowFar}.0;

      float LinearizeDepth(float depth) {
        float z = depth * 2.0 - 1.0; // Back to NDC 
        return (2.0 * near_plane * far_plane) / (far_plane + near_plane - z * (far_plane - near_plane));
      }

      void main () {
        float depth = texture2D(depthTex, v_uv).r;
        gl_FragColor = vec4(vec3(LinearizeDepth(depth) / far_plane), 1.0);
      }

    `,
  })
  depthDebugMesh.setPosition({
    x: -innerWidth / 2 + width / 2 + 20,
    y: -innerHeight / 2 + height / 2 + 20,
  })
}

new CameraController(camera, document.body, true)

viewManager.setActiveView(VIEWS_DEFINITIONS['HOME'])

document.body.addEventListener('click', onMouseClick)
document.body.addEventListener('mousemove', onMouseMove)
requestAnimationFrame(updateFrame)

function onMouseClick(e) {
  e.preventDefault()
  const { hoveredItem } = store.getState()
  if (!hoveredItem) {
    return
  }
  viewManager.setActiveView(VIEWS_DEFINITIONS[hoveredItem]).resetPosZ()
}

function onMouseMove(e) {
  e.preventDefault()
  const rect = canvas.getBoundingClientRect()
  mousePosition.x = e.clientX - rect.left
  mousePosition.y = e.clientY - rect.top
}

function updateFrame(ts) {
  ts /= 1000

  gl.enable(gl.DEPTH_TEST)
  gl.depthFunc(gl.LEQUAL)

  gl.clearColor(0.8, 0.8, 0.8, 1)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  hoverManager.determineHoveredIdx(camera, mousePosition.x, mousePosition.y)
  viewManager.updateMatrix()

  {
    depthFramebuffer.bind()
    gl.viewport(0, 0, DEPTH_TEXTURE_WIDTH, DEPTH_TEXTURE_HEIGHT)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    viewManager.render(
      // @ts-ignore
      {
        projectionMatrix: lightingManager.lightProjectionMatrix,
        viewMatrix: lightingManager.shadowTextureWorldMatrixInv,
      },
      true,
      null,
    )

    depthFramebuffer.unbind()
  }

  {
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
    viewManager.render(camera, false, depthFramebuffer.depthTexture)
  }

  {
    gl.activeTexture(gl.TEXTURE0)
    depthFramebuffer.depthTexture.bind()
    depthDebugMesh.use().setCamera(orthoCamera).draw()
  }

  requestAnimationFrame(updateFrame)
}
