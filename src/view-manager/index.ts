// import VIEWS_DEFINITIONS from '../VIEWS_DEFINITIONS.json'

import { PerspectiveCamera } from '../lib/hwoa-rang-gl/dist/esm'

import TextureManager from '../texture-manager'
import View from './view'

export default class ViewManager {
  #view1: View
  #view2: View
  #activeView: number
  #textureManager: TextureManager
  #viewDefinition

  constructor(gl) {
    this.#textureManager = new TextureManager({
      idealFontSize: 110,
      maxSize: Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), 2048),
    }).showDebug(0.1)

    this.#view1 = new View(gl, {
      idx: 0,
      textureManager: this.#textureManager,
    })

    this.#view2 = new View(gl, {
      idx: 1,
      textureManager: this.#textureManager,
    })

    this.#view2.setPosition(0, 0, -5)
  }

  resetScaleZ(): this {
    if (this.#activeView === 0) {
      this.#view1.resetScaleZ()
    } else {
      this.#view2.resetScaleZ()
    }
    return this
  }

  setActiveView(viewDefiniton: Object): this {
    if (this.#activeView != null) {
      this.#activeView = this.#activeView === 0 ? 1 : 0
      const temp = this.#view1
      this.#view1 = this.#view2
      this.#view2 = temp
    } else {
      this.#activeView = 0
    }
    const oldViewDefinition = this.#viewDefinition
    if (this.#activeView === 0) {
      this.#view1.setView(viewDefiniton)
      if (oldViewDefinition) {
        this.#view2.setView(oldViewDefinition)
      }
    } else {
      this.#view2.setView(viewDefiniton)
      if (oldViewDefinition) {
        this.#view1.setView(oldViewDefinition)
      }
    }
    this.#viewDefinition = viewDefiniton
    return this
  }

  setHoveredIdx(hoveredIdx: number) {
    if (this.#activeView === 0) {
      this.#view1.setHoveredIdx(hoveredIdx)
    } else {
      this.#view2.setHoveredIdx(hoveredIdx)
    }
    return this
  }

  render(camera: PerspectiveCamera) {
    if (this.#activeView === 0) {
      this.#view1.render(camera)
    } else {
      this.#view2.render(camera)
    }
  }
}
