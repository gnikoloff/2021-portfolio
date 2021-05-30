import { mat4 } from 'gl-matrix'
import { PerspectiveCamera, Texture } from '../lib/hwoa-rang-gl/dist/esm'
import store from '../store'

import TextureManager from '../texture-manager'
import ResourceManager from '../resource-manager'
import View from './view'

import VIEWS_DEFINITIONS from '../VIEWS_DEFINITIONS.json'

export default class ViewManager {
  #view0: View
  #view1: View
  #textureManager: TextureManager
  #shadowTextureMatrix: mat4

  #viewDefinition: Object
  #activeViewName: string

  #isTransitioning = false
  #activeViewIdx: number

  constructor(gl, { loadManager }: { loadManager: ResourceManager }) {
    this.#textureManager = new TextureManager({
      idealFontSize: 80,
      maxSize: Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), 2048),
      loadManager,
    })
    const state = store.getState()
    if (state.debugMode) {
      this.#textureManager.showDebug(0.1)
    }

    this.#view0 = new View(gl, {
      idx: 0,
      textureManager: this.#textureManager,
    })

    this.#view1 = new View(gl, {
      idx: 1,
      textureManager: this.#textureManager,
    })

    store.subscribe(this.onGlobalStateChange)
  }

  private onGlobalStateChange = () => {
    const state = store.getState()
    const { activeView, shadowTextureMatrix, hasLoadedResources } = state

    if (!hasLoadedResources) {
      return
    }

    if (activeView) {
      if (this.#activeViewName) {
        if (activeView !== this.#activeViewName) {
          this.setActiveView(VIEWS_DEFINITIONS[activeView].items)
          // this.resetPosZ()
          this.#activeViewName = activeView
        }
      } else {
        this.setActiveView(VIEWS_DEFINITIONS[activeView].items, false)
        // this.resetPosZ()
        this.#activeViewName = activeView
      }
    }

    if (shadowTextureMatrix) {
      if (this.#shadowTextureMatrix) {
        if (!mat4.equals(shadowTextureMatrix, this.#shadowTextureMatrix)) {
          this.#view0.setShadowTextureMatrix(shadowTextureMatrix)
          this.#view1.setShadowTextureMatrix(shadowTextureMatrix)
          this.#shadowTextureMatrix = shadowTextureMatrix
        }
      } else {
        this.#view0.setShadowTextureMatrix(shadowTextureMatrix)
        this.#view1.setShadowTextureMatrix(shadowTextureMatrix)
        this.#shadowTextureMatrix = shadowTextureMatrix
      }
    }
  }

  setHoveredIdx(hoveredIdx: number): string | null {
    if (this.#activeViewIdx === 0) {
      return this.#view0.setHoveredIdx(hoveredIdx)
    } else {
      return this.#view1.setHoveredIdx(hoveredIdx)
    }
  }

  setActiveView = (viewDefiniton: Object, fadeOutLastView = true) => {
    const oldViewDefinition = this.#viewDefinition
    this.#view0.setView(
      this.#activeViewIdx === 0
        ? oldViewDefinition || viewDefiniton
        : viewDefiniton,
    )
    this.#view1.setView(
      this.#activeViewIdx === 0
        ? viewDefiniton
        : oldViewDefinition || viewDefiniton,
    )

    this.#isTransitioning = true

    let promise

    if (fadeOutLastView) {
      promise = Promise.all(
        this.#activeViewIdx === 0
          ? [this.#view0.transitionOut(), this.#view1.transitionIn()]
          : [this.#view0.transitionIn(), this.#view1.transitionOut()],
      )
    } else {
      promise = this.#view0.transitionIn()
    }

    promise.then(() => {
      this.#isTransitioning = false
      if (this.#activeViewIdx == null) {
        this.#activeViewIdx = 0
      } else {
        this.#activeViewIdx = this.#activeViewIdx === 0 ? 1 : 0
      }
    })

    this.#viewDefinition = viewDefiniton
  }

  updateMatrix() {
    if (this.#isTransitioning) {
      this.#view0.updateMatrix()
      this.#view1.updateMatrix()
    } else {
      if (this.#activeViewIdx === 0) {
        this.#view0.updateMatrix()
      } else {
        this.#view1.updateMatrix()
      }
    }
  }

  render(
    camera: PerspectiveCamera,
    renderAsSolidColor: boolean = false,
    shadowTexture: Texture = null,
  ) {
    const { hoverIdx } = store.getState()
    this.setHoveredIdx(hoverIdx)
    if (this.#isTransitioning) {
      this.#view0.render(camera, renderAsSolidColor, shadowTexture)
      this.#view1.render(camera, renderAsSolidColor, shadowTexture)
    } else {
      if (this.#activeViewIdx === 0) {
        this.#view0.render(camera, renderAsSolidColor, shadowTexture)
      } else {
        this.#view1.render(camera, renderAsSolidColor, shadowTexture)
      }
    }
  }
}
