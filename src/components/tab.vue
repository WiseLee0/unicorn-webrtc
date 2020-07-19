<template>
  <div class="tab">
    <div
      class="out"
      @click.stop="onTab(index)"
      :class="{'pre-select':selectIndex.pre == index,'cur-select':selectIndex.cur == index,'next-select':selectIndex.next == index}"
      v-for="(icon,index) in icons"
      :key="index"
    >
      <router-link tag="div" class="inner" :to="router[index]">
        <i class="iconfont" :class="icon"></i>
      </router-link>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
@Component
export default class Tab extends Vue {
  icons = ["", "icon-touping", "icon-gongneng", "icon-shezhi", ""];
  router = ["", "/puppet", "/group", "/setting", ""];
  selectIndex = {
    pre: 0,
    cur: 1,
    next: 2
  };
  created() {
    this.$router.push({
      path: "/puppet"
    });
  }
  onTab(index: number) {
    if (index == 0 || index == this.router.length - 1) return;
    this.selectIndex = {
      pre: index - 1,
      cur: index,
      next: index + 1
    };
  }
}
</script>

<style scoped lang="stylus">
@import '~@/assets/iconfont.css'
@import '~@/assets/base.styl'

.tab
  display flex
  flex-direction column
  width 100px
  padding-left 20px
  box-sizing border-box
  height 100%
  background-color $bgc
  color $bgc-font
  border-radius 0 20px 20px 0

  .out
    width 100%
    height 70px
    background-color $bgc
    overflow hidden
    -webkit-app-region no-drag

    .inner
      z-index 99
      width 100%
      height 100%
      display flex
      justify-content center
      align-items center
      background-color $bgc

    i
      font-size 22px
      margin-left -10px
      cursor pointer

  .pre-select
    background-color $theme

    .inner
      border-radius 0 0 20px 0
      background-color $bgc

  .cur-select
    background-color $bgc

    .inner
      border-radius 20px 0 0 20px
      color $bgc
      background-color $theme

  .next-select
    background-color $theme

    .inner
      border-radius 0 20px 0 0
      background-color $bgc
</style>
