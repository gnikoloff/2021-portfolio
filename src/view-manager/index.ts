import { PerspectiveCamera } from '../lib/hwoa-rang-gl/dist/esm'

import TextureManager from '../texture-manager'
import View from './view'

export default class ViewManager {
  #view1: View
  #view2: View
  #textureManager: TextureManager

  constructor(gl) {
    this.#textureManager = new TextureManager({
      idealFontSize: 110,
      maxSize: Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), 2048),
    }).showDebug(0.1)

    this.#view1 = new View(gl, {
      textureManager: this.#textureManager,
    })
  }

  setActiveView(viewDefiniton: Object) {
    this.#view1.setView(viewDefiniton)
  }

  setHoveredIdx(hoveredIdx: number) {
    this.#view1.setHoveredIdx(hoveredIdx)
    return this
  }

  render(camera: PerspectiveCamera) {
    this.#view1.render(camera)
  }
}
