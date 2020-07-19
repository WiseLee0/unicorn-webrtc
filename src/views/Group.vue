<template>
  <div class="group">
    <operate v-if="panelFlag"></operate>
    <component :is="currentCompent" :data="connectData" @close="onClose" v-else></component>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Operate from "@/components/group-operate.vue";
import Chat from "@/components/group-chat.vue";
import Multiplayer from "@/components/group-multiplayer.vue";
import { ipcRenderer } from "electron";
type TData = {
  label: string;
  name: string;
  receiveName: string[];
};
@Component({
  components: {
    Operate,
    Chat,
    Multiplayer
  }
})
export default class Group extends Vue {
  currentCompent = "";
  panelFlag = true;
  connectData!: TData;
  created() {
    ipcRenderer.on("join-status", this.watchJoinStatus);
  }

  // 加入房间
  watchJoinStatus(e: any, data: TData) {
    this.currentCompent = data.label;
    this.panelFlag = false;
    this.connectData = data;
  }

  onClose() {
    this.panelFlag = true;
  }
}
</script>

<style  lang="stylus"></style>
