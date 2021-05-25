const IDEAL_TEXTURE_SIZE = 2048

export default class TextureManager {
  #canvas0 = document.createElement('canvas')
  #ctx0 = this.#canvas0.getContext('2d')

  #canvas1 = document.createElement('canvas')
  #ctx1 = this.#canvas1.getContext('2d')

  #cellWidth: number
  #cellHeight: number
  #cellsCountX: number
  #cellsCountY: number
  #maxSize: number
  #idealFontSize: number
  

  constructor ({
    cellsCountX,
    cellsCountY,
    maxSize,
    idealFontSize,
  }) {
    this.#canvas0.width = maxSize
    this.#canvas0.height = maxSize

    this.#canvas1.width = maxSize
    this.#canvas1.height = maxSize

    this.#maxSize = maxSize
    this.#idealFontSize = idealFontSize

    this.#cellsCountX = cellsCountX
    this.#cellsCountY = cellsCountY

    this.#cellWidth = this.#maxSize / this.#cellsCountX
    this.#cellHeight = this.#maxSize / this.#cellsCountY
  }

  setActiveView (viewItems): this {
    viewItems.forEach((item) => {
      if (item.type === 'TEXT_SPLIT') {
        const x = item.x * this.#cellWidth
        const y = item.y * this.#cellHeight
        const count = item.value.length

        const fontSize = this.#idealFontSize * (this.#maxSize / IDEAL_TEXTURE_SIZE)
        
        this.#ctx0.font = `${fontSize}px Helvetica`
        this.#ctx0.textAlign = 'center'
        this.#ctx0.textBaseline = 'middle'
        this.#ctx0.fillStyle = 'red'

        for (let i = 0; i < count; i++) {
          const char = item.value[i]
          const charX = i * this.#cellWidth + this.#cellWidth / 2
          const charY = y + this.#cellHeight / 2
          this.#ctx0.fillText(char, x + charX, charY)
        }
      } else if (item.type === 'TEXT') {
        const paddingLeft = (item.paddingLeft || 0) * this.#cellWidth
        const x = item.x * this.#cellWidth + paddingLeft
        const y = item.y * this.#cellHeight + this.#cellHeight / 2
        
        const fontSize = this.#idealFontSize * (this.#maxSize / IDEAL_TEXTURE_SIZE)

        this.#ctx0.font = `${fontSize}px Helvetica`
        this.#ctx0.textBaseline = 'middle'
        this.#ctx0.textAlign = 'left'
        this.#ctx0.fillStyle = 'white'
        this.#ctx0.fillText(item.value, x, y)
      }
    })
    return this
  }

  getActiveCanvas (): HTMLCanvasElement {
    return this.#canvas0
  }

  showDebug (scaleFactor: number = 1): this {
    const div = document.createElement('div')
    div.setAttribute('id', 'texture-manager-debug')
    div.setAttribute('style', `
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      z-index: 9999;
      pointer-events: none;
      transform-origin: 100% 100%;
      transform: scale(${scaleFactor});
    `)

    this.#canvas0.setAttribute('style', `
      border: 16px dotted red;
      margin-bottom: 62px;
    `)

    div.appendChild(this.#canvas0)

    this.#canvas1.setAttribute('style', `
      border: 16px dotted red;
    `)

    div.appendChild(this.#canvas1)

    this.#ctx0.lineWidth = 3
    this.#ctx1.lineWidth = 3

    this.#ctx0.strokeStyle = 'white'
    this.#ctx1.strokeStyle = 'white'

    for (let x = 0; x < this.#cellsCountX; x++) {
      for (let y = 0; y < this.#cellsCountY; y++) {
        this.#ctx0.strokeRect(
          x * this.#cellWidth,
          y * this.#cellHeight,
          this.#cellWidth,
          this.#cellHeight
        )
        this.#ctx1.strokeRect(
          x * this.#cellWidth,
          y * this.#cellHeight,
          this.#cellWidth,
          this.#cellHeight
        )
      }
    }

    document.body.appendChild(div)
    return this
  }
  
}
