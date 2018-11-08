<template>
  <div class="container ListPage my-4" @ondragover="handleDragOver" @onDrop="handleDrop">
    <div class="row justify-content-center">
      <div class="col-md-8">
        <header class="mb-4">
          <h1 class="mb-3">JSNES</h1>
          <p>A JavaScript NES emulator.</p>
          <p>
            By <a href="https://twitter.com/bfirsh">Ben Firshman</a>. Source
            on <a href="https://github.com/bfirsh/jsnes">GitHub</a>.
          </p>
        </header>
        <b-list-group class="mb-4">
          <router-link v-for="key in Object.keys(config.ROMS)" :key="key" :to="'/run/' + encodeURIComponent(key)" class="list-group-item">
            {{key}}
            <span class="float-right">&rsaquo;</span></router-link>
        </b-list-group>
        <p>Or, drag and drop a ROM file onto the page.</p>
      </div>
    </div>
  </div>
</template>
<script>
import '@/assets/css/ListPage.css'
import config from '@/assets/script/config'
export default {

  data () {
    return {
      config: config,
      start: null
    }
  },
  mounted () {

  },
  methods: {

    handleDragOver (e) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    },
    handleDrop (e) {
      e.preventDefault()

      const file = e.dataTransfer.items
        ? e.dataTransfer.items[0].getAsFile()
        : e.dataTransfer.files[0]

      this.$route.history.push({ path: '/run', state: { file } })
    }
  }
}
</script>
