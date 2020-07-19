<template>
  <div class="puppet">
    <operate v-if="panelFlag"></operate>
    <component :is="currentCompent" :data="connectData" @close="onClose" v-else></component>
    <video ref="screenshot" v-show="false" autoplay></video>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Operate from "@/components/puppet-operate.vue";
import Screen from "@/components/puppet-screen.vue";
import File from "@/components/puppet-file.vue";
import { ipcRenderer, desktopCapturer } from "electron";
type TData = {
  label: string;
  camp: string;
  remoteCode: string;
};
@Component({
  components: {
    Operate,
    Screen,
    File
  }
})
export default class Puppet extends Vue {
  currentCompent = "";
  panelFlag = true;
  connectData!: TData;
  $refs!: {
    screenshot: HTMLVideoElement;
  };
  loaded = false;

  created() {
    ipcRenderer.on("connect-status", this.watchConnectStatus);
    ipcRenderer.on("screen-shot", this.watchScreenShot);
  }

  // 切换面板
  watchConnectStatus(e: any, data: TData) {
    this.currentCompent = data.label;
    this.panelFlag = false;
    this.connectData = data;
  }
  onClose() {
    this.panelFlag = true;
  }

  // 屏幕截图
  async watchScreenShot() {
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: 1, height: 1 }
    });
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: sources[0].id,
          maxWidth: window.screen.width,
          maxHeight: window.screen.height
        }
      } as MediaTrackConstraints
    });
    const ele = this.$refs.screenshot;
    ele.srcObject = mediaStream;
    ele.onloadedmetadata = () => {
      if (this.loaded) return;
      this.loaded = true;
      ele.width = ele.videoWidth;
      ele.height = ele.videoHeight;
      const canvas = document.createElement("canvas");
      canvas.width = ele.videoWidth;
      canvas.height = ele.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx!.drawImage(ele, 0, 0, canvas.width, canvas.height);
      const dataURL = canvas.toDataURL();
      ipcRenderer.send("createScreenshot", dataURL);
      try {
        mediaStream.getTracks()[0].stop();
      } catch (error) {
        console.log(error);
      }
    };
  }
}
</script>

<style scoped lang="stylus"></style>
