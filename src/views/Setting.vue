<template>
  <div class="setting">
    <h3 class="title">录制视频热键</h3>
    <div class="row">
      <span>ALT + A</span>
      <span>开始录制视频，没有弹窗提示</span>
    </div>
    <div class="row">
      <span>ALT + D</span>
      <span>结束录制视频</span>
    </div>
    <div class="row">
      <span>ALT + Q</span>
      <span>暂停录制</span>
    </div>
    <div class="row">
      <span>ALT + E</span>
      <span>继续录制，没有弹窗提示</span>
    </div>
    <h3 class="title">截图热键</h3>
    <div class="row">
      <span>ALT + Z</span>
      <span>开启截图</span>
    </div>
    <div class="row">
      <span>SPACE</span>
      <span>完成截图，没有弹窗提示</span>
    </div>
    <h3 class="title">说明</h3>
    <span class="desc">所有文件存储都在桌面</span>
    <span class="desc">有 bug 请联系我，祝你愉快！</span>
    <i class="el-icon-error" @click="closePupput"></i>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { ipcRenderer } from 'electron';

@Component
export default class Setting extends Vue {
  closePupput() {
    ipcRenderer.send("puppet-close");
  }
}
</script>

<style scoped lang="stylus">
@import '~@/assets/base.styl'

.setting
  display flex
  flex-direction column
  margin-left 40px
  margin-top 20px
  color $font2

  .title
    color $font
    margin 10px 0
    padding 0
    letter-spacing 4px

  .row
    display flex
    flex-direction row
    margin-left 20px
    font-size 16px
    font-family 'Times New Roman', Times, serif
    line-height 20px

    span:nth-child(1)
      width 80px
      display inline-block

  .desc
    font-size 16px
    font-family 'Times New Roman', Times, serif
    line-height 24px
    margin-left 20px

.el-icon-error
  position absolute
  right 15px
  top 10px
  font-size 24px
  transition all 0.5s
  cursor pointer
  -webkit-app-region no-drag

.el-icon-error:hover
  transform scale(1.2)
</style>
