import WebFont from 'webfontloader'

export default class ResourceManager {
  #resourcesMap = new Map()

  static FONT_FACE = 'font-woff'
  static FONT_GOOGLE = 'google-font'
  static IMAGE = 'img'

  static getFVD(weight: string | number, style) {
    let output = ''
    if (weight === 400 || weight === 'normal') {
      output += 'n:'
    }
    if (style === 'normal') {
      output += '4'
    }
    return output
  }

  static loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => {
        resolve(image)
      }
      image.onerror = () => reject()
      image.src = url
    })
  }

  static loadWoffFont(name: string, weight: string | number, style: string) {
    const fvd = ResourceManager.getFVD(weight, style)
    const fontFamily = `${name}:${fvd}`
    return new Promise((resolve, reject) => {
      WebFont.load({
        custom: {
          families: [fontFamily],
        },
        active: () => {
          resolve(fontFamily)
        },
        fontinactive: () => {
          reject()
        },
      })
    })
  }

  static loadGoogleFont(name: string, weight: string | number, style: string) {
    const fontFamily = `${name}:${weight}:latin`
    return new Promise((resolve, reject) => {
      WebFont.load({
        google: {
          families: [fontFamily],
        },
        active: () => {
          resolve(fontFamily)
        },
        fontinactive: () => {
          reject()
        },
      })
    })
  }

  getImage(resourceName): HTMLImageElement {
    const resource = this.#resourcesMap.get(resourceName)
    if (resource) {
      return resource.image
    } else {
      console.error('Could not locate resource')
    }
  }

  addFontResource(resourceAux): this {
    const { name } = resourceAux
    this.#resourcesMap.set(name, resourceAux)
    return this
  }

  addImageResource(imageUrl: string, resourceAux): this {
    this.#resourcesMap.set(imageUrl, resourceAux)
    return this
  }

  load() {
    const promises = []
    let n = 0
    for (const [url, entry] of this.#resourcesMap.entries()) {
      let promise
      if (entry.type === ResourceManager.FONT_FACE) {
        promise = ResourceManager.loadWoffFont(
          entry.name,
          entry.weight,
          entry.style,
        )
      } else if (entry.type === ResourceManager.FONT_GOOGLE) {
        promise = ResourceManager.loadGoogleFont(
          entry.name,
          entry.weight,
          entry.style,
        )
      } else if (entry.type === ResourceManager.IMAGE) {
        promise = ResourceManager.loadImage(url).then((img) => {
          entry.image = img
          return img
        })
      }
      promise = promise.then((res) => {
        console.log((n + 1) / this.#resourcesMap.size)
        n++
        return res
      })
      promises.push(promise)
    }
    Promise.all(promises).then(() => {
      console.log('loaded all resource')
    })
  }
}