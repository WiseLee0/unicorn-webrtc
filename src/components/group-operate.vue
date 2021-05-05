<template>
  <div class="operate">
    <div class="group-up">
      <h3>欢迎加入房间聊天</h3>
      <h3>Welcome to the chat</h3>
    </div>
    <div class="down group-down">
      <el-input placeholder="输入你的昵称" v-model="name" :maxlength="7"></el-input>
      <div class="row">
        <el-radio v-model="radio" label="1" class="radio">多人聊天</el-radio>
        <el-radio v-model="radio" label="2" class="radio">多人视频</el-radio>
      </div>
      <el-button type="primary" round class="btn" @click="onConnect">加入房间</el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { Input, Radio, Button } from "element-ui";
import { ipcRenderer } from "electron";

@Component({
  components: {
    [Input.name]: Input,
    [Radio.name]: Radio,
    [Button.name]: Button
  }
})
export default class Operate extends Vue {
  name = "";
  radio = "1";
  created() {
    ipcRenderer.on("notFound", this.notFound);
  }

  // 输入的用户被占用
  notFound() {
    this.name = "";
    new Notification("not found", {
      body: "昵称被占用了哦"
    });
  }

  // 开始连接
  onConnect() {
    // 多人聊天 or 多人视频
    if (this.radio == "1") {
      ipcRenderer.send("joinRoom", this.name, "chat");
    }

    if (this.radio == "2") {
      ipcRenderer.send("joinRoom", this.name, "multiplayer");
    }
  }
}
</script>

<style scoped lang="stylus">
@import '~@/assets/base.styl'

.operate
  width 300px
  height 270px

.group-up
  h3
    margin 10px
    padding 0
    color $font
    letter-spacing 2px

  h3:nth-child(2)
    color $font2
    font-family 'Times New Roman', Times, serif

.group-down
  height 130px
</style>
