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
import { setActiveView, setHoveredItem } from './store/actions'

import ResourceManager from './resource-manager'
import ViewManager from './view-manager'
import HoverManager from './hover-manager'
import LightingManager from './lighting-manager'

import VIEWS_DEFINITIONS from './VIEWS_DEFINITIONS.json'

import {
  DEPTH_TEXTURE_WIDTH,
  DEPTH_TEXTURE_HEIGHT,
  VIEW_HOME,
} from './constants'

import './index.css'

// ------------------------------------------------

const dpr = Math.min(2.5, devicePixelRatio)
const mousePosition = { x: -1000, y: -1000 }
const canvas = document.createElement('canvas')
const gl = canvas.getContext('webgl')

const loadManager = new ResourceManager()
const hoverManager = new HoverManager(gl, {})
const viewManager = new ViewManager(gl, {
  loadManager,
})

const lightingManager = new LightingManager(gl)

const camera = new PerspectiveCamera(
  (45 * Math.PI) / 180,
  innerWidth / innerHeight,
  0.1,
  100,
)
const orthoCamera = new OrthographicCamera(
  -innerWidth / 2,
  innerWidth / 2,
  innerHeight / 2,
  -innerHeight / 2,
  0.1,
  4,
)

{
  const { cameraX, cameraY, cameraZ } = store.getState()
  camera.position = [cameraX, cameraY, cameraZ]
  camera.lookAt([0, 0, 0])
}

{
  orthoCamera.position = [0, 0, 2]
  orthoCamera.lookAt([0, 0, 0])
}

{
  const { lightX, lightY, lightZ } = store.getState()
  lightingManager.position = [lightX, lightY, lightZ]
  lightingManager.computeShadowTextureMatrix()
}

{
  const { debugMode } = store.getState()
  if (debugMode) {
    new CameraController(camera, document.body, true)
  }
}

{
  const viewName = getActiveViewFromURL()
  store.dispatch(setActiveView(viewName))
}

loadManager
  .addFontResource({
    type: ResourceManager.FONT_FACE,
    name: 'Venus Rising',
    weight: 400,
    style: 'normal',
  })
  .addFontResource({
    type: ResourceManager.FONT_GOOGLE,
    name: 'Noto Sans JP',
    weight: 400,
    style: 'normal',
  })

extractAllImageUrlsFromViews().forEach(({ value: url }) => {
  loadManager.addImageResource(url, {
    type: ResourceManager.IMAGE,
  })
})

document.body.appendChild(canvas)
document.body.addEventListener('click', onMouseClick)
document.body.addEventListener('mousemove', onMouseMove)

window.onpopstate = (e) => {
  const viewName = getActiveViewFromURL()
  store.dispatch(setActiveView(viewName, false))
}

loadManager.load()
sizeCanvas()
requestAnimationFrame(updateFrame)

function onMouseClick(e) {
  e.preventDefault()
  const { hoveredItem } = store.getState()
  if (!hoveredItem) {
    return
  }
  if (hoveredItem.startsWith('https')) {
    window.open(hoveredItem, '_blank')
  } else {
    store.dispatch(setActiveView(hoveredItem))
    // viewManager.setActiveView(VIEWS_DEFINITIONS[hoveredItem])
    // .resetPosZ()
  }

  // store.dispatch(setHoveredItem(null))
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
    lightingManager.depthFramebuffer.bind()
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

    lightingManager.depthFramebuffer.unbind()
  }

  {
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
    viewManager.render(
      camera,
      false,
      lightingManager.depthFramebuffer.depthTexture,
    )
  }

  const state = store.getState()

  if (state.debugMode) {
    lightingManager.renderDebugMesh(orthoCamera)
  }

  requestAnimationFrame(updateFrame)
}

function extractAllImageUrlsFromViews(): Array<{ value: string }> {
  const allImagesInProject = []
  for (const view of Object.values(VIEWS_DEFINITIONS)) {
    const images = (view.items as Array<any>).filter(
      ({ type }) => type === 'IMAGE',
    )
    allImagesInProject.push(...images)
  }
  return allImagesInProject
}

function sizeCanvas() {
  canvas.width = innerWidth * dpr
  canvas.height = innerHeight * dpr
  canvas.style.setProperty('width', `${innerWidth}px`)
  canvas.style.setProperty('height', `${innerHeight}px`)
}

function getActiveViewFromURL(url = location.pathname) {
  const urlFragments = url.split('/')
  let viewName = urlFragments[urlFragments.length - 1]
  if (!viewName) {
    viewName = VIEW_HOME
  }
  return viewName
}
