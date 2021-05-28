// import VIEWS_DEFINITIONS from '../VIEWS_DEFINITIONS.json'

import { ReadonlyMat4 } from 'gl-matrix'
import { PerspectiveCamera, Texture } from '../lib/hwoa-rang-gl/dist/esm'
import store from '../store'

import TextureManager from '../texture-manager'
import View from './view'

export default class ViewManager {
  #view0: View
  #view1: View
  #activeView: number
  #textureManager: TextureManager
  #viewDefinition

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
  }

  private setHoveredIdx(hoveredIdx: number) {
    if (this.#activeView === 0) {
      this.#view0.setHoveredIdx(hoveredIdx)
    } else {
      this.#view1.setHoveredIdx(hoveredIdx)
    }
    return this
  }

  resetPosZ(): this {
    this.#view0.resetPosZ()
    this.#view1.resetPosZ()
    return this
  }

  setActiveView(viewDefiniton: Object): this {
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
    return this
  }

  updateMatrix() {
    if (this.#activeView === 0) {
      this.#view0.updateMatrix()
    } else {
      this.#view1.updateMatrix()
    }
  }

  setShadowTextureMatrix(shadowTextureMatrix: ReadonlyMat4) {
    this.#view0.setShadowTextureMatrix(shadowTextureMatrix)
    this.#view1.setShadowTextureMatrix(shadowTextureMatrix)
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
