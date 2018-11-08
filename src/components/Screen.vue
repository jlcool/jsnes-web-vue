<template>
  <canvas
        class="Screen"
        :width='SCREEN_WIDTH'
        :height='SCREEN_HEIGHT'

        ref='canvas'
      />
</template>
<script>
import '@/assets/css/Screen.css'
var context = null
var imageData = null
var buf = null
var buf8 = null
var buf32 = null
export default {
  data () {
    return {
      SCREEN_WIDTH: 256,
      SCREEN_HEIGHT: 240

    }
  },
  mounted () {
    this.initCanvas()
  },
  updated () {
    this.initCanvas()
  },
  methods: {
    initCanvas () {
      context = this.$refs.canvas.getContext('2d')
      imageData = context.getImageData(
        0,
        0,
        this.SCREEN_WIDTH,
        this.SCREEN_HEIGHT
      )

      context.fillStyle = 'black'
      // set alpha to opaque
      context.fillRect(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT)

      // buffer to write on next animation frame
      buf = new ArrayBuffer(imageData.data.length)
      // Get the canvas buffer in 8bit and 32bit
      buf8 = new Uint8ClampedArray(buf)
      buf32 = new Uint32Array(buf)

      // Set alpha
      for (var i = 0; i < buf32.length; ++i) {
        buf32[i] = 0xff000000
      }
    },

    setBuffer (buffer) {
      var i = 0
      for (var y = 0; y < this.SCREEN_HEIGHT; ++y) {
        for (var x = 0; x < this.SCREEN_WIDTH; ++x) {
          i = y * 256 + x
          // Convert pixel from NES BGR to canvas ABGR
          buf32[i] = 0xff000000 | buffer[i] // Full alpha
        }
      }
    },

    writeBuffer () {
      imageData.data.set(buf8)
      context.putImageData(imageData, 0, 0)
    },

    fitInParent () {
      let parent = this.$refs.canvas.parentNode
      let parentWidth = parent.clientWidth
      let parentHeight = parent.clientHeight
      let parentRatio = parentWidth / parentHeight
      let desiredRatio = this.SCREEN_WIDTH / this.SCREEN_HEIGHT
      if (desiredRatio < parentRatio) {
        this.$refs.canvas.style.width = `${Math.round(parentHeight * desiredRatio)}px`
        this.$refs.canvas.style.height = `${parentHeight}px`
      } else {
        this.$refs.canvas.style.width = `${parentWidth}px`
        this.$refs.canvas.style.height = `${Math.round(parentWidth / desiredRatio)}px`
      }
    },

    screenshot () {
      var img = new Image()
      img.src = this.$refs.canvas.toDataURL('image/png')
      return img
    },

    handleMouseDown (e) {
      if (!this.props.onMouseDown) return
      // Make coordinates unscaled
      let scale = this.SCREEN_WIDTH / parseFloat(this.$refs.canvas.style.width)
      let rect = this.$refs.canvas.getBoundingClientRect()
      let x = Math.round((e.clientX - rect.left) * scale)
      let y = Math.round((e.clientY - rect.top) * scale)
      this.props.onMouseDown(x, y)
    }
  }
}
</script>
