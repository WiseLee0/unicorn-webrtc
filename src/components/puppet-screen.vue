<template>
  <div class="screen">
    <span>{{content}}</span>
    <el-button
      type="primary"
      round
      class="btn"
      @click="onCloseSelf"
      v-if="data.camp=='receive'"
    >断开连接</el-button>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { ipcRenderer, desktopCapturer } from "electron";
import { Button } from "element-ui";

const pc = new window.RTCPeerConnection({
  iceServers: [
    {
      urls: "turn:188.131.221.100:3478",
      username: "wiselee",
      credential: "123456"
    }
  ]
});
type TData = {
  label: string;
  camp: string;
  remoteCode: string;
};
@Component({
  components: {
    [Button.name]: Button
  }
})
export default class Screen extends Vue {
  content = "";
  @Prop() data!: TData;
  created() {
    this.init();
    this.negotiation();
  }

  onCloseSelf() {
    location.reload();
    ipcRenderer.send("forward", "receive-close");
  }

  onClose() {
    new Notification("提示", {
      body: "对方断开了与你的连接"
    });
    location.reload();
  }

  init() {
    if (this.data.camp == "operate") {
      ipcRenderer.send("createControlWindow");
      this.content = `正在远程控制${this.data.remoteCode}中...`;
    }
    if (this.data.camp == "receive") {
      this.content = `正在被${this.data.remoteCode}远程控制中...`;
    }
    ipcRenderer.on("close", this.onClose);
  }

  // 发送者 and 接收者 媒体协商
  negotiation() {
    if (this.data.camp == "receive") {
      ipcRenderer.on("offer", this.watchOfferTosendAnswer);
      pc.onicecandidate = this.sendCandidate;
      ipcRenderer.on("candidate", this.addCandidate);
      pc.ondatachannel = this.watchDataCannel;
    }
  }

  // 媒体协商过程
  async watchOfferTosendAnswer(e: any, offer: string) {
    await this.addScreenStream();
    await pc.setRemoteDescription(JSON.parse(offer));
    await pc.setLocalDescription(await pc.createAnswer());
    ipcRenderer.send(
      "forward",
      "contorl-answer",
      JSON.stringify(pc.localDescription)
    );
  }

  // 添加屏幕流
  async addScreenStream() {
    const sources = await desktopCapturer.getSources({
      types: ["screen"]
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
    mediaStream.getTracks().forEach((track: any) => {
      pc.addTrack(track, mediaStream);
    });
  }

  // 网络协商
  sendCandidate(e: RTCPeerConnectionIceEvent) {
    if (e && e.candidate)
      ipcRenderer.send("forward", "sendControlCandidate", e.candidate.toJSON());
  }
  async addCandidate(e: any, candidate: RTCIceCandidateInit) {
    if (pc.remoteDescription && pc.remoteDescription.type) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  // 数据通道
  watchDataCannel(ev: RTCDataChannelEvent) {
    ev.channel.onmessage = async e => {
      const { type, data } = JSON.parse(e.data);
      if (type == "move" || type == "click") {
        data.screen = {
          width: window.screen.width * window.devicePixelRatio,
          height: window.screen.height * window.devicePixelRatio
        };
      }
      ipcRenderer.send("robot", type, data);
    };
  }
}
</script>

<style  lang="stylus">
@import '~@/assets/base.styl'

.screen
  flex 1
  height 100%
  font-size 22px
  font-weight 700
  margin-left 20px
  background-color $theme
  color $font
  display flex
  flex-direction column
  justify-content center

  .btn
    background-color $bgc
    color $bgc-font
    border none
    letter-spacing 2px
    margin-top 20px
    -webkit-app-region no-drag
</style>
