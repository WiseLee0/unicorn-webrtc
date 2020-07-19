<template>
  <div class="home">
    <tab></tab>
    <keep-alive>
      <router-view></router-view>
    </keep-alive>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Tab from "@/components/tab.vue";

@Component({
  components: {
    Tab
  }
})
export default class Home extends Vue {}
</script>

<style scoped lang="stylus">
@import '~@/assets/base.styl'

.home
  position absolute
  top 0
  left 0
  right 0
  bottom 0
  background-color $theme
  display flex
  flex-direction row
  overflow hidden
  color $font
  border-radius 20px
  -webkit-app-region drag
  -webkit-user-select none
</style>
