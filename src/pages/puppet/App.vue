<template>
  <div class="home">
    <tab></tab>
    <keep-alive>
      <router-view></router-view>
    </keep-alive>
    <i class="el-icon-error" @click="closePupput"></i>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Tab from "@/components/tab.vue";
import { ipcRenderer } from "electron";

@Component({
  components: {
    Tab
  }
})
export default class Home extends Vue {
  closePupput() {
    ipcRenderer.send("puppet-close");
  }
}
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

  i
    position absolute
    right 15px
    top 10px
    font-size 24px
    transition all 0.5s
    cursor pointer
    -webkit-app-region no-drag

  i:hover
    transform scale(1.2)
</style>
