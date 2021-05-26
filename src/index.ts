import {
  CameraController,
  PerspectiveCamera,
} from './lib/hwoa-rang-gl/dist/esm'

import store from './store'
import {
  setActiveView,
  setHoveredItem,
  setHoverItemEndX,
  setHoverItemStartX,
  setHoverItemY,
} from './store/actions'
import VIEWS_DEFINITIONS from './VIEWS_DEFINITIONS.json'

import ViewManager from './view-manager'
import HoverManager from './hover-manager'

import './index.css'

store.dispatch(setActiveView('home'))

const mousePosition = { x: -1000, y: -1000 }
const canvas = document.createElement('canvas')
const gl = canvas.getContext('webgl')

let hoveredIdx = -1

const dpr = Math.min(2.5, devicePixelRatio)
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
new CameraController(camera)

// .setActiveView()
const hoverManager = new HoverManager(gl, {})
const viewManager = new ViewManager(gl)

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
  viewManager.setActiveView(VIEWS_DEFINITIONS[hoveredItem]).resetScaleZ()
}

function onMouseMove(e) {
  e.preventDefault()
  const rect = canvas.getBoundingClientRect()
  mousePosition.x = e.clientX - rect.left
  mousePosition.y = e.clientY - rect.top
}

function updateFrame(ts) {
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)

  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  gl.enable(gl.DEPTH_TEST)
  gl.depthFunc(gl.LEQUAL)

  gl.clearColor(0.2, 0.2, 0.2, 1)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  viewManager.render(camera)

  const pickIdx = hoverManager.getHoveredIdx(
    camera,
    mousePosition.x,
    mousePosition.y,
  )
  if (pickIdx !== hoveredIdx) {
    hoveredIdx = pickIdx
    viewManager.setHoveredIdx(pickIdx)
  }

  requestAnimationFrame(updateFrame)
}
