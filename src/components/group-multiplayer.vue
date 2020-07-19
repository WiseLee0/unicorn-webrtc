<template>
  <div class="container">
    <h2>你正在加入多人视频中...</h2>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { ipcRenderer } from "electron";
type TData = {
  label: string;
  name: string;
  receiveName: string[];
  nums: number;
};
@Component
export default class Multiplayer extends Vue {
  @Prop() data!: TData;
  created() {
    ipcRenderer.send("createMultiplayerWindow", this.data);
  }
}
</script>

<style scoped lang="stylus">
@import '~@/assets/base.styl'

h2
  margin-left 40px
  margin-top 50%
  color $font
</style>
