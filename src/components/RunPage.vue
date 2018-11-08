<template>
<div class="RunPage">
        <b-nav
          class="navbar navbar-expand"
          ref="navbar"
        >
          <ul class="navbar-nav mr-auto">
            <li class="navitem">
              <router-link to="/" class="nav-link">
                &lsaquo; Back
              </router-link>
            </li>
          </ul>
          <Button
            outline
            color="primary"
            @click='handlePauseResume'
            :disabled='!running'
          >
            {{paused ? "Resume" : "Pause"}}
          </Button>
        </b-nav>
<span v-if="error">{{error}}</span>
          <div v-else
            class="screen-container"
            ref='screenContainer'
          >

              <b-progress v-if="loading"
                :value='loadedPercent'
                :style='{
                  position: "absolute",
                  width: "70%",
                  left: "15%",
                  top: "48%"
                }'
              />

            <Screen
              ref='screen'
            @GenerateFrame='{() =>
                nes.frame();
              }'
            />

          </div>

      </div>
</template>
<script>
import { NES } from 'jsnes'
import Raven from 'raven-js'

import config from '@/assets/script/config'
import KeyboardController from '@/assets/script/KeyboardController'
import Screen from './Screen'
import Speakers from '@/assets/script/Speakers'
import FrameTimer from '@/assets/script/FrameTimer'
import '@/assets/css/RunPage.css'
var _this
var nes
export default {
  components: {
    Screen
  },
  data () {
    return {

      speakers: null,
      running: false,
      frameTimer: null,
      loading: null,
      paused: false,
      error: null,
      loadedPercent: 0,
      keyboardController: null,
      currentRequest: null,
      fpsInterval: null
    }
  },
  mounted () {
    _this = this
    this.speakers = new Speakers({
      onBufferUnderrun: (actualSize, desiredSize) => {
        if (!_this.running || _this.paused) {
          return
        }
        // Skip a video frame so audio remains consistent. This happens for
        // a variety of reasons:
        // - Frame rate is not quite 60fps, so sometimes buffer empties
        // - Page is not visible, so requestAnimationFrame doesn't get fired.
        //   In this case emulator still runs at full speed, but timing is
        //   done by audio instead of requestAnimationFrame.
        // - System can't run emulator at full speed. In this case it'll stop
        //    firing requestAnimationFrame.
        // console.log(
        //   'Buffer underrun, running another frame to try and catch up'
        // )
        nes.frame()
        // desiredSize will be 2048, and the NES produces 1468 samples on each
        // frame so we might need a second frame to be run. Give up after that
        // though -- the system is not catching up
        if (_this.speakers.buffer.size() < desiredSize) {
          console.log('Still buffer underrun, running a second frame')
          nes.frame()
        }
      }
    })
    nes = new NES({
      onFrame: _this.$refs.screen.setBuffer,
      onStatusUpdate: console.log,
      onAudioSample: _this.speakers.writeSample
    })

    // For debugging
    window.nes = nes

    this.frameTimer = new FrameTimer({
      onGenerateFrame: Raven.wrap(nes.frame),
      onWriteFrame: Raven.wrap(this.$refs.screen.writeBuffer)
    })

    this.keyboardController = new KeyboardController({
      onButtonDown: nes.buttonDown,
      onButtonUp: nes.buttonUp
    })
    document.addEventListener('keydown', this.keyboardController.handleKeyDown)
    document.addEventListener('keyup', this.keyboardController.handleKeyUp)
    document.addEventListener(
      'keypress',
      this.keyboardController.handleKeyPress
    )

    window.addEventListener('resize', this.layout)
    console.log('typeof layout' + typeof _this.layout)
    _this.layout()

    this.load()
  },
  beforeDestroy () {
    if (this.currentRequest) {
      this.currentRequest.abort()
    }
    this.stop()
    document.removeEventListener(
      'keydown',
      this.keyboardController.handleKeyDown
    )
    document.removeEventListener('keyup', this.keyboardController.handleKeyUp)
    document.removeEventListener(
      'keypress',
      this.keyboardController.handleKeyPress
    )
    window.removeEventListener('resize', this.layout)

    window.nes = undefined
  },
  methods: {
    loadBinary (path, callback, handleProgress) {
      var req = new XMLHttpRequest()
      req.open('GET', path)
      req.overrideMimeType('text/plain; charset=x-user-defined')
      req.onload = function () {
        if (this.status === 200) {
          callback(null, this.responseText)
        } else if (this.status === 0) {
          // Aborted, so ignore error
        } else {
          callback(new Error(req.statusText))
        }
      }
      req.onerror = function () {
        callback(new Error(req.statusText))
      }
      req.onprogress = handleProgress
      req.send()
      return req
    },
    load () {
      if (this.$route.params.rom) {
        const romName = this.$route.params.rom
        const path = config.ROMS[romName]
        if (!path) {
          this.error = `No such ROM: ${romName}`
          return
        }
        this.currentRequest = this.loadBinary(
          path,
          (err, data) => {
            if (err) {
              window.alert(`Error loading ROM: ${err.toString()}`)
            } else {
              _this.handleLoaded(data)
            }
          },
          _this.handleProgress
        )
      } else {
        window.alert('No ROM provided')
      }
      // else if (this.props.location.state && this.props.location.state.file) {
      //   let reader = new FileReader()
      //   reader.readAsBinaryString(this.props.location.state.file)
      //   reader.onload = e => {
      //     this.currentRequest = null
      //     this.handleLoaded(e.target.result)
      //   }
      // }
    },

    handleProgress (e) {
      if (e.lengthComputable) {
        this.loadedPercent = e.loaded / e.total * 100
      }
    },

    handleLoaded (data) {
      console.log('handleLoaded')
      this.uiEnabled = true
      this.running = true
      this.loading = false
      nes.loadROM(data)
      this.start()
    },

    start () {
      this.frameTimer.start()
      this.speakers.start()
      this.fpsInterval = setInterval(() => {
        console.log(`FPS: ${nes.getFPS()}`)
      }, 1000)
    },

    stop () {
      this.frameTimer.stop()
      this.speakers.stop()
      clearInterval(this.fpsInterval)
    },

    handlePauseResume () {
      if (this.paused) {
        this.paused = false
        this.start()
      } else {
        this.paused = true
        this.stop()
      }
    },

    layout () {
      let navbarHeight = parseFloat(window.getComputedStyle(this.$refs.navbar).height)
      this.$refs.screenContainer.style.height = `${window.innerHeight -
      navbarHeight}px`
      this.$refs.screen.fitInParent()
    },

    toggleControlsModal () {
      this.controlsModal = !this.controlsModal
    }
  }
}
</script>
