import {
  CONTENT_TYPE_SPLIT_TEXT,
  CONTENT_TYPE_TEXT,
  GRID_COUNT_X,
  GRID_COUNT_Y,
} from './constants'

const IDEAL_TEXTURE_SIZE = 2048

export default class TextureManager {
  #canvas0 = document.createElement('canvas')
  #ctx0 = this.#canvas0.getContext('2d')

  #canvas1 = document.createElement('canvas')
  #ctx1 = this.#canvas1.getContext('2d')

  #cellWidth: number
  #cellHeight: number
  #GRID_COUNT_X: number
  #GRID_COUNT_Y: number
  #maxSize: number
  #idealFontSize: number

  constructor({ maxSize, idealFontSize }) {
    this.#canvas0.width = maxSize
    this.#canvas0.height = maxSize

    this.#canvas1.width = maxSize
    this.#canvas1.height = maxSize

    this.#maxSize = maxSize
    this.#idealFontSize = idealFontSize

    this.#cellWidth = this.#maxSize / GRID_COUNT_X
    this.#cellHeight = this.#maxSize / GRID_COUNT_Y
  }

  getTextureCanvas(idx: number, viewItems): HTMLCanvasElement {
    const ctx = idx === 0 ? this.#ctx0 : this.#ctx1
    const canvas = idx === 0 ? this.#canvas0 : this.#canvas1

    ctx.clearRect(0, 0, this.#maxSize, this.#maxSize)
    viewItems.forEach((item) => {
      if (item.type === CONTENT_TYPE_SPLIT_TEXT) {
        const x = item.x * this.#cellWidth
        const y = item.y * this.#cellHeight
        const count = item.value.length

        const fontSize =
          this.#idealFontSize * (this.#maxSize / IDEAL_TEXTURE_SIZE)

        ctx.font = `${fontSize}px Helvetica`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = 'red'

        for (let i = 0; i < count; i++) {
          const char = item.value[i]
          const charX = i * this.#cellWidth + this.#cellWidth / 2
          const charY = y + this.#cellHeight / 2
          ctx.fillText(char, x + charX, charY)
        }
      } else if (item.type === CONTENT_TYPE_TEXT) {
        const paddingLeft = (item.paddingLeft || 0) * this.#cellWidth
        const x = item.x * this.#cellWidth + paddingLeft
        const y = item.y * this.#cellHeight + this.#cellHeight / 2

        const fontSize =
          this.#idealFontSize * (this.#maxSize / IDEAL_TEXTURE_SIZE)

        ctx.font = `${fontSize}px Helvetica`
        ctx.textBaseline = 'middle'
        ctx.textAlign = 'left'
        ctx.fillStyle = 'white'
        ctx.fillText(item.value, x, y)
      }
    })
    return canvas
  }

  showDebug(scaleFactor: number = 1): this {
    const div = document.createElement('div')
    div.setAttribute('id', 'texture-manager-debug')
    div.setAttribute(
      'style',
      `
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      z-index: 9999;
      pointer-events: none;
      transform-origin: 100% 100%;
      transform: scale(${scaleFactor});
    `,
    )

    this.#canvas0.setAttribute(
      'style',
      `
      border: 16px dotted red;
      margin-bottom: 62px;
    `,
    )

    div.appendChild(this.#canvas0)

    this.#canvas1.setAttribute(
      'style',
      `
      border: 16px dotted red;
    `,
    )

    div.appendChild(this.#canvas1)

    this.#ctx0.lineWidth = 3
    this.#ctx1.lineWidth = 3

    this.#ctx0.strokeStyle = 'white'
    this.#ctx1.strokeStyle = 'white'

    for (let x = 0; x < GRID_COUNT_X; x++) {
      for (let y = 0; y < GRID_COUNT_Y; y++) {
        this.#ctx0.strokeRect(
          x * this.#cellWidth,
          y * this.#cellHeight,
          this.#cellWidth,
          this.#cellHeight,
        )
        this.#ctx1.strokeRect(
          x * this.#cellWidth,
          y * this.#cellHeight,
          this.#cellWidth,
          this.#cellHeight,
        )
      }
    }

    document.body.appendChild(div)
    return this
  }
}
