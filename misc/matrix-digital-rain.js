// MIT licensed (check license.md)

function diceThrow(diceFaces = 6) {
  if (diceFaces < 1) return false
  if (diceFaces == 1) return true
  return 0 == Math.trunc(Math.random() * diceFaces)
}
function randomInt(...range) {
  const min = range.length > 1 ? Math.min(...range) : 0
  const max = Math.max(...range)
  return Math.floor(Math.random() * (max - min + 1) + min)
}
function randomFloat(...range) {
  const min = range.length > 1 ? Math.min(...range) : 0
  const max = Math.max(...range)
  return Math.random() * (max - min) + min
}
function minOrBetweenMinAndMax_int(...range) {
  if (Array.isArray(range[0])) range = range[0]
  if (range.length == 1) return range[0]
  const min = Math.min(...range)
  const max = Math.max(...range)
  return Math.floor(Math.random() * (max - min + 1) + min)
}
function minOrBetweenMinAndMax_float(...range) {
  if (Array.isArray(range[0])) range = range[0]
  if (range.length == 1) return range[0]
  const min = Math.min(...range)
  const max = Math.max(...range)
  return Math.random() * (max - min) + min
}

// function getAbsolutePosition(element) {
//   const rect = element.getBoundingClientRect()
//   return {
//     top: rect.top + window.scrollY,
//     left: rect.left + window.scrollX
//   }
// }

class FallingStar {
  #config // the global config
  #glyph; #x // static
  // dynamic
  #disabled
  #speed; #y; #glow
  #fixedDropSpace; #yLastDrop = 0; #yNextDrop; #glyphLastDrop
 
  constructor(column, config) {
    Object.seal(this)
    this.#config = config
    this.#x = column * this.#config.charWidth
    this.randomizeAtTop()
  }

  update(ctx, screenHeight) {
    if (this.#disabled) return
    this.draw(ctx)
    this.#y += this.#speed
    if (this.#y > screenHeight) {
      this.#disabled = true
      setTimeout(this.randomizeAtTop.bind(this), minOrBetweenMinAndMax_int(this.#config.loopPause))
      return
    }

    let doDrop

    if (this.#fixedDropSpace) {
      if (this.#y >= this.#yNextDrop) {
        this.randomGlyph()
        doDrop = true
        this.#yNextDrop += this.#config.charHeight + this.#fixedDropSpace
      }
    } else if (diceThrow(this.#config.rndDropDice)) {
      this.randomGlyph()
      if (this.#y > this.#yLastDrop + this.#config.charHeight) {
        doDrop = true
        this.#yLastDrop = this.#y
      }
    }

    if (doDrop) {
      this.#glyphLastDrop = this.#glyph
      return new StarSpawn(this.#config, {
        x: this.#x,
        y: this.#y,
        glow: this.#glow,
        glyph: this.#glyph,
        fadeFactor: diceThrow(this.#config.slowFadeDice) ? 
          this.#config.slowFade : this.#config.fade
      })
    }
  }
  
  draw(ctx) {
    ctx.fillStyle = `rgba(${this.#config.color.join()}, ${this.#glow.toFixed(2)})`
    ctx.fillText(this.#glyph, this.#x, this.#y)
  }

  randomizeAtTop() {
    this.#disabled = false
    this.#y = 0
    this.#yLastDrop = 0
    this.#glow  = minOrBetweenMinAndMax_float(this.#config.glow)
    // log(this.#glow)
    this.#speed = minOrBetweenMinAndMax_float(this.#config.speed)
    if (diceThrow(this.#config.fixedDropDice)) { 
      this.#fixedDropSpace = (diceThrow(this.#config.fixedDropHighDice) ? 
        randomInt(this.#config.fixedDropHigh) : randomInt(this.#config.fixedDropLow)) || 1
      this.#yNextDrop = this.#config.charHeight + this.#fixedDropSpace
    } else {
      this.#fixedDropSpace = false
    }
    this.randomGlyph()
  }

  randomGlyph() {
    let newGlyph
    do {
      newGlyph = this.#config.charset[randomInt(this.#config.charset.length-1)]
    } while (newGlyph == this.#glyph || newGlyph == this.#glyphLastDrop)
    this.#glyph = newGlyph
  }
}

class StarSpawn {
  #glyph; #x; #y; #glow; #fadeFactor
  #config

  constructor(config, {x, y, glyph, glow, fadeFactor}) {
    Object.seal(this)
    this.#config = config
    this.#x = x
    this.#y = y
    this.#glow = glow
    this.#glyph = glyph
    this.#fadeFactor = fadeFactor
  }

  update(ctx) {
    this.#glow -= this.#fadeFactor
    if (this.#glow < 0.01) {
      return true // is gone
    }
    ctx.fillStyle = `rgba(${this.#config.color.join()}, ${this.#glow.toFixed(2)})`
    ctx.fillText(this.#glyph, this.#x, this.#y)
  }
}

// pretty similar to CSS
function parseConfig(defaultConfig, configString) {
  const config = defaultConfig
  if (configString) {
    const massage = e => {
      e = e.trim()
      if (!isNaN(e)) e = +e
      return e
    }
    const pairs = configString.split(';')
    for (const pair of pairs) {
      let [key, value] = pair.split(':').map(massage)
      if (key == 0) continue // empty keys become 0 
      if (!(key in defaultConfig)) {
        console.error('Unrecognized key: '+key)
        continue
      }
      if (value.includes?.(',')) { // then it's an array
        if (!Array.isArray(defaultConfig[key])) {
          console.error('Key is not an array: '+key)
          continue
        }
        value = value.split(',').map(massage)
      } else if (Array.isArray(defaultConfig[key])) [
        value = [value]
      ]
      config[key] = value ?? true
    }
  }
  const charset = []
  for (const char of config.charset) {
    switch (char) { // skip these
      case ' ': case '\n': case '\r': case '\t': continue
    }
    charset.push(char)
  }
  config.charset = charset
  return config
}

const log = console.log

const DEFAULT_CONFIG = { // default config
  charset: (
    'Б Г Д Ё Ж Й Л П У Ф Ц Ч Щ Ъ Ы Э Ю Я' +
    `アイウエオカキクケコサソンシスセタチテトナニヌネノハヒフヘホマミムメモヤユヨラリルレワヰヱヲ`
  ),
  fixed: false, // fixed to screen?
  font: 'Arial',
  charWidth: 18,
  color: [0, 255, 0],
  loopPause: [500], // [min] or [min, max]
  spawnDelay: [],   // [min] or [min, max]
  speed: [1.0, 3.0],// [min] or [min, max]
  glow:  [0.2, 1.0],// [min] or [min, max]
  fade:     0.004,
  slowFade: 0.001,
  slowFadeDice: 10,
  rndDropDice: 10, // chance of drop when random
  fixedDropDice: 2, // chance of fixed drop interval
  fixedDropLow: 10, // low spacing from 0 to value
  fixedDropHigh: 300, // high spacing from 0 to value
  fixedDropHighDice: 2, // chance of high spacing
  zIndex: -1,
  minWidth: 10,
  minHeight: 100,
}

/** A tag function to remove indents from template literals. */
function dedent(strings, ...values) {
  const trimLeft = /^\s+/gm
  //const trimDoubleSpaces = /\s+/g
  let result = ''
  for (const string of strings) {
    result += string + (values.shift() || '')
  }
  return result.replace(trimLeft, '')//.replace(trimDoubleSpaces, ' ')
}

class MatrixDigitalRain extends HTMLElement {
  #numFallingStars = 0
  #fallingStarCols = []
  #starDrops = new Set()
  #nextSpawnTime = 0
  #canvas; #ctx
  #active // should draw?
  #timeLastResize = 0; #resizeTimeout
  #config
  #shadow // its shadow root

  constructor() {
    super()
    this.#config = parseConfig(DEFAULT_CONFIG, this.getAttribute('config'))
    const styleDef = dedent`
      :host {display: block}
      #display {position: absolute; z-index: ${this.#config.zIndex}}
    `
    this.#shadow = this.attachShadow({mode: 'open'})
    // this.#shadow.innerHTML = `
    //   <style>${styleDef}</style>
    //   <canvas id="display"></canvas>
    //   <slot></slot>
    // `
    const style  = document.createElement('style')
    const slot   = document.createElement('slot')
    const canvas = document.createElement('canvas')
    canvas.id = 'display'
    style.textContent = styleDef
    this.#shadow.append(style, canvas, slot)

    this.#canvas = this.#shadow.getElementById('display')
    this.#ctx    = this.#canvas.getContext('2d')
    this.#initFont()
  }

  async #initFont() {
    if (this.#config.font.startsWith('url(')) {
      try {
        const uniqueFontName = 'customFont_987238'
        const font = new FontFace(uniqueFontName, this.#config.font)
        await font.load()
        document.fonts.add(font)
        this.#config.font = uniqueFontName
      } catch (error) {
        this.#config.font = 'Arial'
      }
    }
    this.#ctx.font = this.#config.charWidth+'px '+this.#config.font
    const metrics = this.#ctx.measureText(this.#config.charset.join(''))
    this.#config.charHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
  } 

  connectedCallback() {
    if (this.isConnected) {
      requestAnimationFrame(this.#animate.bind(this))
    }
  }

  // disconnectedCallback() {
  //   log('disconnectedCallback')
  // }

  #animate(currentTime) {
    // if still connected to DOM
    if (this.isConnected) {
      requestAnimationFrame(this.#animate.bind(this))
    } else return
    this.#canvasMatchSize()
    if (!this.#active) return // if rendering paused

    // spawn new falling star?
    if (currentTime > this.#nextSpawnTime) {
      // #fallingStarCols.length is only set after matchPosAndSizeOfParent has ran
      if (this.#numFallingStars < this.#fallingStarCols.length) {
        const lastIndex = this.#fallingStarCols.length - 1
        const searchDir = diceThrow(1)
        const randomIndex = randomInt(lastIndex)
        for ( // search for random empty column
          let i = randomIndex;
          searchDir ? (i <= lastIndex) : (i >= 0);
          i += (searchDir ? 1 : -1)
        ) {
          if (!this.#fallingStarCols[i]) {
            this.#fallingStarCols[i] = new FallingStar(i, this.#config)
            this.#numFallingStars ++
            break
          }
        }
        if (this.#config.spawnDelay.length == 0) {
          this.#nextSpawnTime = currentTime + randomInt(this.#canvas.height)
        } else {
          this.#nextSpawnTime = currentTime + minOrBetweenMinAndMax_int(this.#config.spawnDelay)
        }
      }
    }
    // update falling stars and their drops
    this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height)
    for (const star of this.#fallingStarCols) {
      if (!star) continue
      const starSpawn = star.update(this.#ctx, this.clientHeight)
      if (starSpawn) this.#starDrops.add(starSpawn)
    }
    for (const star of this.#starDrops) {
      const hasFainted = star.update(this.#ctx)
      if (hasFainted) this.#starDrops.delete(star)
    }
  }

  #canvasMatchSize() {
    this.#active = (this.clientWidth >= this.#config.minWidth 
                && this.clientHeight >= this.#config.minHeight)
    this.#canvas.hidden = !this.#active
    this.#canvas.style.width = this.clientWidth+'px'
    this.#canvas.style.height = this.clientHeight+'px'

    if (this.#canvas.width != this.clientWidth || this.#canvas.height != this.clientHeight) { // if resized
      clearTimeout(this.#resizeTimeout)
      if (Date.now() - this.#timeLastResize < 500) {
        this.#resizeTimeout = setTimeout(this.#canvasMatchSize.bind(this), 100)
        return // avoid banging of get/putImageData
      }

      this.#timeLastResize = Date.now()

      const numColumns = Math.trunc(this.clientWidth / this.#config.charWidth)
      while (this.#fallingStarCols.length > numColumns) {
        const fallingStar = this.#fallingStarCols.pop()
        if (fallingStar) {
          this.#numFallingStars --
        }
      }
      this.#fallingStarCols.length = numColumns

      if (this.#active) {
        this.#canvas.width  = this.clientWidth
        this.#canvas.height = this.clientHeight //- 5
        const imageData = this.#ctx.getImageData(0, 0, this.#canvas.width, this.#canvas.height)
        this.#ctx.putImageData(imageData, 0, 0)
      }
      // a Chromium bug clears it on resize
      this.#ctx.font = this.#config.charWidth+'px '+this.#config.font 
    }
  }

}

customElements.define('matrix-digital-rain', MatrixDigitalRain)
