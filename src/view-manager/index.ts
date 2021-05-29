// import VIEWS_DEFINITIONS from '../VIEWS_DEFINITIONS.json'

import { mat4, ReadonlyMat4 } from 'gl-matrix'
import { PerspectiveCamera, Texture } from '../lib/hwoa-rang-gl/dist/esm'
import store from '../store'

import TextureManager from '../texture-manager'
import View from './view'

import VIEWS_DEFINITIONS from '../VIEWS_DEFINITIONS.json'

export default class ViewManager {
  #view0: View
  #view1: View
  #activeView: number
  #textureManager: TextureManager
  #viewDefinition
  #shadowTextureMatrix: mat4
  #activeViewName

  constructor(gl, { loadManager }) {
    this.#textureManager = new TextureManager({
      idealFontSize: 80,
      maxSize: Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), 2048),
      loadManager,
    }) //.showDebug(0.1)

    this.#view0 = new View(gl, {
      idx: 0,
      textureManager: this.#textureManager,
    })

    this.#view1 = new View(gl, {
      idx: 1,
      textureManager: this.#textureManager,
    })

    this.#view1.setPosition(0, 0, -5)

    store.subscribe(this.onGlobalStateChange)
  }

  private setHoveredIdx(hoveredIdx: number) {
    if (this.#activeView === 0) {
      this.#view0.setHoveredIdx(hoveredIdx)
    } else {
      this.#view1.setHoveredIdx(hoveredIdx)
    }
    return this
  }

  private onGlobalStateChange = () => {
    const state = store.getState()
    const { activeView, shadowTextureMatrix } = state

    if (activeView) {
      if (this.#activeViewName) {
        if (activeView !== this.#activeViewName) {
          this.setActiveView(VIEWS_DEFINITIONS[activeView])
          this.resetPosZ()
          this.#activeViewName = activeView
        }
      } else {
        this.setActiveView(VIEWS_DEFINITIONS[activeView])
        this.resetPosZ()
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

  setActiveView = (viewDefiniton: Object) => {
    if (this.#activeView != null) {
      this.#activeView = this.#activeView === 0 ? 1 : 0
      const temp = this.#view0
      this.#view0 = this.#view1
      this.#view1 = temp
    } else {
      this.#activeView = 0
    }
    const oldViewDefinition = this.#viewDefinition
    if (this.#activeView === 0) {
      this.#view0.setView(viewDefiniton)
      if (oldViewDefinition) {
        this.#view1.setView(oldViewDefinition)
      }
    } else {
      this.#view1.setView(viewDefiniton)
      if (oldViewDefinition) {
        this.#view0.setView(oldViewDefinition)
      }
    }
    this.#viewDefinition = viewDefiniton
  }

  resetPosZ(): this {
    this.#view0.resetPosZ()
    this.#view1.resetPosZ()
    return this
  }

  updateMatrix() {
    if (this.#activeView === 0) {
      this.#view0.updateMatrix()
    } else {
      this.#view1.updateMatrix()
    }
  }

  render(
    camera: PerspectiveCamera,
    renderAsSolidColor: boolean = false,
    shadowTexture: Texture = null,
  ) {
    if (this.#activeView === 0) {
      this.#view0.render(camera, renderAsSolidColor, shadowTexture)
    } else {
      this.#view1.render(camera, renderAsSolidColor, shadowTexture)
    }

    const { hoverIdx } = store.getState()
    this.setHoveredIdx(hoverIdx)
  }
}
