import {
  CameraController,
  OrthographicCamera,
  PerspectiveCamera,
} from './lib/hwoa-rang-gl/dist/esm'

import store from './store'
import {
  setActiveView,
  setCameraX,
  setCameraY,
  setCameraZ,
  setHoveredItem,
  setLightX,
} from './store/actions'

import ResourceManager from './resource-manager'
import ViewManager from './view-manager'
import HoverManager from './hover-manager'
import LightingManager from './lighting-manager'
import LoadingScreen from './loading-screen'

import VIEWS_DEFINITIONS from './VIEWS_DEFINITIONS.json'

import {
  DEPTH_TEXTURE_WIDTH,
  DEPTH_TEXTURE_HEIGHT,
  VIEW_HOME,
} from './constants'

import './index.css'
import { animate, anticipate, circIn } from 'popmotion'
import TextureManager from './texture-manager'

// ------------------------------------------------

let oldTime = 0

const dpr = Math.min(2.5, devicePixelRatio)
const mousePosition = { x: -1000, y: -1000 }
const canvas = document.createElement('canvas')
const gl = canvas.getContext('webgl')

const loadManager = new ResourceManager()
const hoverManager = new HoverManager(gl, {})
const viewManager = new ViewManager(gl, {
  loadManager,
})

const loadScreen = new LoadingScreen(gl)

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
  // if (debugMode) {
  // new CameraController(camera, document.body, true)
  // }
}

let hasLoadedResources = false

const $loader = document.getElementById('loading')

store.subscribe(() => {
  const state = store.getState()
  $loader.textContent = `${Math.round(state.loadedResourcesPercentage * 100)}%`
  if (hasLoadedResources !== state.hasLoadedResources) {
    hasLoadedResources = true
    const { cameraX, cameraY, cameraZ } = state
    const targetCameraX = 0
    const targetCameraY = 0
    const targetCameraZ = 16
    animate({
      duration: 1000,
      ease: anticipate,
      onUpdate: (v) => {
        const x = cameraX + (targetCameraX - cameraX) * v
        const y = cameraY + (targetCameraY - cameraY) * v
        const z = cameraZ + (targetCameraZ - cameraZ) * v
        store.dispatch(setCameraX(x))
        store.dispatch(setCameraY(y))
        store.dispatch(setCameraZ(z))
      },
      onComplete: () => {
        // new CameraController(camera, document.body, true)
      },
    })
  }
})

{
  const viewName = getActiveViewFromURL()
  store.dispatch(setActiveView(viewName))
}

loadManager
  .addFontResource({
    type: ResourceManager.FONT_FACE,
    name: TextureManager.DEFAULT_HEADING_FONT_FAMILY,
    weight: TextureManager.FONT_WEIGHT_HEADING,
    style: TextureManager.FONT_STYLE,
  })
  .addFontResource({
    type: ResourceManager.FONT_GOOGLE,
    name: TextureManager.DEFAULT_BODY_FONT_FAMILY,
    weight: TextureManager.FONT_WEIGHT_BODY,
    style: TextureManager.FONT_STYLE,
  })
  .addArtificialDelay(750)

extractAllImageUrlsFromViews().forEach(({ value: url }, i) => {
  loadManager.addImageResource(url)
  if (i === 3) {
    loadManager.addArtificialDelay(300)
  }
})

document.body.addEventListener('click', onMouseClick)
document.body.addEventListener('mousemove', onMouseMove)
document.body.addEventListener('touchstart', onTouchStart)
document.body.addEventListener('touchmove', onTouchMove)

window.onpopstate = (e) => {
  const viewName = getActiveViewFromURL()
  store.dispatch(setActiveView(viewName, false))
}

loadManager.load()
sizeCanvas()
document.body.appendChild(canvas)
requestAnimationFrame(updateFrame)

function onMouseClick(e) {
  e.preventDefault()

  const state = store.getState()
  const { touchDevice } = state

  if (touchDevice) {
    const hoverIdx = hoverManager.determineHoveredIdx(
      camera,
      mousePosition.x,
      mousePosition.y,
    )
    const linkItem = viewManager.setHoveredIdx(hoverIdx)

    if (!linkItem) {
      return
    }

    if (linkItem.startsWith('https')) {
      window.open(linkItem, '_blank')
    } else if (linkItem.startsWith('mailto')) {
      window.open(linkItem)
    } else {
      store.dispatch(setActiveView(linkItem))
    }

    mousePosition.x = -2000
    mousePosition.y = -2000

    hoverManager.determineHoveredIdx(camera, mousePosition.x, mousePosition.y)
    viewManager.setHoveredIdx(hoverIdx)

    store.dispatch(setHoveredItem(null))
  } else {
    const { hoveredItem } = store.getState()
    if (!hoveredItem) {
      return
    }
    if (hoveredItem.startsWith('https')) {
      window.open(hoveredItem, '_blank')
    } else if (hoveredItem.startsWith('mailto')) {
      window.open(hoveredItem)
    } else {
      store.dispatch(setActiveView(hoveredItem))
    }
  }
}

function onMouseMove(e) {
  e.preventDefault()
  const state = store.getState()
  const { hasLoadedResources } = state

  mousePosition.x = e.clientX
  mousePosition.y = e.clientY

  const normMouseX = (mousePosition.x / innerWidth) * 2 - 1
  const normMouseY = (mousePosition.y / innerHeight) * 2 - 1

  if (!hasLoadedResources) {
    return null
  }

  store.dispatch(setCameraX(normMouseX * 4))
  store.dispatch(setCameraY(normMouseY * 4))
  store.dispatch(setLightX(normMouseX))

  const hoverIdx = hoverManager.determineHoveredIdx(
    camera,
    mousePosition.x,
    mousePosition.y,
  )
  viewManager.setHoveredIdx(hoverIdx)
}

function onTouchStart(e) {
  e.preventDefault()
  e.stopPropagation()
}

function onTouchMove(e) {
  e.preventDefault()
  e.stopPropagation()
}

function updateFrame(ts) {
  requestAnimationFrame(updateFrame)

  ts /= 1000
  const dt = ts - oldTime
  oldTime = ts

  {
    const { cameraX, cameraY, cameraZ } = store.getState()
    const speed = dt * 3
    const x = camera.position[0] + (cameraX - camera.position[0]) * speed
    const y = camera.position[1] + (cameraY - camera.position[1]) * speed
    const z = camera.position[2] + (cameraZ - camera.position[2]) * speed
    camera.setPosition({ x, y, z }).updateViewMatrix()
  }

  gl.enable(gl.DEPTH_TEST)
  gl.depthFunc(gl.LEQUAL)

  gl.clearColor(0.8, 0.8, 0.8, 1)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)

  const { hasLoadedResources } = store.getState()
  loadScreen.render(camera)

  if (!hasLoadedResources) {
    return
  }

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
