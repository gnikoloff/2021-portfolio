export default class ResourceManager {
  #resourcesMap = new Map()

  static FONT_TYPE = 'font'
  static IMAGE_TYPE = 'img'

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

  getImage(resourceName) {
    const resource = this.#resourcesMap.get(resourceName)
    if (resource) {
      return resource.image
    } else {
      console.error('Could not locate resource')
    }
  }

  addLoadResource(resourceURL: string, resourceAux) {
    this.#resourcesMap.set(resourceURL, resourceAux)
    return this
  }

  load() {
    const promises = []
    let n = 0
    for (const [url, entry] of this.#resourcesMap.entries()) {
      let promise
      if (entry.type === ResourceManager.FONT_TYPE) {
        // @ts-ignore
        const fontFace = new FontFace(entry.fontName, url, {
          fontName: entry.fontName,
          fontWeight: entry.fontWeight,
        })
        fontFace.load().then((res) => {
          // @ts-ignore
          document.fonts.add(fontFace)
          console.log((n + 1) / this.#resourcesMap.size)
          n++
          return res
        })
      } else {
        promise = ResourceManager.loadImage(url).then((img) => {
          entry.image = img
          console.log((n + 1) / this.#resourcesMap.size)
          n++
          return img
        })
      }
      promises.push(promise)
    }
    Promise.all(promises).then(() => {
      console.log('loaded all resource')
    })
  }
}
