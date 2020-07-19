<template>
  <div class="operate">
    <div class="up">
      <span class="title">接受远程控制</span>
      <div class="row">
        <span>我的控制码</span>
        <span>{{myCode}}</span>
      </div>
    </div>
    <div class="down">
      <span class="title">远程控制另外一台电脑</span>
      <el-autocomplete
        v-model="remoteCode"
        :maxlength="6"
        @keyup.enter.native="onConnect"
        :fetch-suggestions="historySearch"
        placeholder="输入伙伴的ID，连接伙伴吧"
      ></el-autocomplete>
      <div class="row">
        <el-radio v-model="radio" label="1" class="radio">屏幕传输</el-radio>
        <el-radio v-model="radio" label="2" class="radio">文件传输</el-radio>
      </div>
      <el-button type="primary" round class="btn" @click="onConnect">连接</el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { Autocomplete, Radio, Button } from "element-ui";
import { ipcRenderer } from "electron";

@Component({
  components: {
    [Autocomplete.name]: Autocomplete,
    [Radio.name]: Radio,
    [Button.name]: Button
  }
})
export default class Operate extends Vue {
  radio = "1";
  myCode = "000000";
  remoteCode = "";

  created() {
    this.getMyCode();
    ipcRenderer.on("notFound", this.notFound);
  }
  async getMyCode() {
    this.myCode = await ipcRenderer.invoke("getMyCode");
  }
  // 开始连接
  onConnect() {
    if (this.remoteCode.length !== 6) {
      new Notification("遇到一些错误", {
        body: "伙伴的ID长度应该为6位"
      });
      return;
    }
    // 屏幕控制 or 文件传输
    if (this.radio == "1") {
      ipcRenderer.send("connect", this.remoteCode, "screen");
    }

    if (this.radio == "2") {
      ipcRenderer.send("connect", this.remoteCode, "file");
    }
  }
  // 输入的用户没有找到
  notFound() {
    this.remoteCode = "";
    new Notification("not found", {
      body: "没有找到你的小伙伴，在确认下吧"
    });
  }
  historySearch(remoteCode: string, cb: (a: any) => {}) {
    const restaurants = [];
    const results = "";
    if (this.remoteCode == "1") {
      console.log("1");
      cb([{ value: "三全鲜食（北新泾店）", address: "长宁区新渔路144号" }]);
      return;
    }
    cb([]);
  }
}
</script>

<style  lang="stylus">
@import '~@/assets/base.styl'

.operate
  display flex
  flex-direction column
  padding 30px 40px

  .up
    display flex
    flex-direction column

    .title
      font-size 24px
      font-weight 700

    .row
      display flex
      flex-direction row
      align-items center
      margin-top 10px

      span:nth-child(1)
        color $font2
        font-size 18px

      span:nth-child(2)
        margin-left 20px
        font-size 22px
        font-weight 700
        letter-spacing 2px

  .down
    -webkit-app-region no-drag
    display flex
    flex-direction column
    justify-content space-between
    margin-top 40px
    width 250px
    height 180px

    .title
      font-size 22px
      font-weight 700

    .el-input__inner
      color $theme
      font-size 16px
      font-weight 700
      letter-spacing 5px
      background-color $bgc
      border none
      border-radius 10px 10px 0 10px

    .el-input__inner::placeholder
      letter-spacing 2px
      font-size 14px
      font-weight normal
      color $font2

    .row
      display flex
      flex-direction row
      align-items center

      .radio
        color $font2

      .el-radio__inner
        background-color $font2
        border 1px solid $bgc-font

      .el-radio__input.is-checked+.el-radio__label
        color $bgc

      .el-radio__input.is-checked .el-radio__inner
        background $bgc
        border-color $bgc

    .btn
      background-color $bgc
      color $bgc-font
      border none
      letter-spacing 2px

  .closebtn
    -webkit-app-region no-drag
    background-color $bgc
    color $bgc-font
    border none
    letter-spacing 2px
    width 200px
</style>
