<template>
  <div id="app">
    <control></control>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Control from "@/views/Control.vue";
@Component({
  components: {
    Control
  }
})
export default class App extends Vue {}
</script>
<style lang="stylus">
#app
  position absolute
  top 0
  left 0
  right 0
  bottom 0
</style>
