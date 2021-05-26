// import VIEWS_DEFINITIONS from '../VIEWS_DEFINITIONS.json'

import { PerspectiveCamera } from '../lib/hwoa-rang-gl/dist/esm'
import store from '../store'

import TextureManager from '../texture-manager'
import View from './view'

export default class ViewManager {
  #view0: View
  #view1: View
  #activeView: number
  #textureManager: TextureManager
  #viewDefinition

  constructor(gl) {
    this.#textureManager = new TextureManager({
      idealFontSize: 110,
      maxSize: Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), 2048),
    }).showDebug(0.1)

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

  resetScaleZ(): this {
    this.#view0.resetScaleZ()
    this.#view1.resetScaleZ()
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

  render(camera: PerspectiveCamera) {
    if (this.#activeView === 0) {
      this.#view0.render(camera)
    } else {
      this.#view1.render(camera)
    }

    const { hoverIdx } = store.getState()
    this.setHoveredIdx(hoverIdx)
  }
}
