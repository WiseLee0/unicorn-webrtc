<template>
  <div id="app">
    <multiplayer></multiplayer>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Multiplayer from "@/views/Multiplayer.vue";
@Component({
  components: {
    Multiplayer
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
