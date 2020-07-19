<template>
  <div class="control">
    <video ref="video" v-show="!content.length"></video>
    <div class="content" v-show="content.length">
      <h2>{{content}}</h2>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { ipcRenderer, IpcRendererEvent } from "electron";
const pc = new window.RTCPeerConnection({
  iceServers: [
    {
      urls: "turn:188.131.221.100:3478",
      username: "wiselee",
      credential: "123456"
    }
  ]
});
const dc = pc.createDataChannel("robotDataCannel");
@Component
export default class Control extends Vue {
  $refs!: {
    video: HTMLVideoElement;
  };

  content = "正在传输中，请稍等...";
  created() {
    this.negotiation();
  }

  // 发送者 and 接收者 媒体协商
  negotiation() {
    this.sendOffer();
    ipcRenderer.on("answer", this.watchAnswer);
    pc.ontrack = this.watchTrack;
    pc.onicecandidate = this.sendCandidate;
    ipcRenderer.on("candidate", this.addCandidate);
    dc.onopen = this.sendDataCannel;
  }
  async sendOffer() {
    const offer = await pc.createOffer({
      offerToReceiveAudio: false,
      offerToReceiveVideo: true
    });
    await pc.setLocalDescription(offer);
    ipcRenderer.send("forward", "puppet-offer", JSON.stringify(offer));
  }
  async watchAnswer(e: any, answer: string) {
    await pc.setRemoteDescription(JSON.parse(answer));
  }
  watchTrack(ev: RTCTrackEvent) {
    if (ev && ev.streams[0]) {
      const videoElem = this.$refs.video;
      videoElem.srcObject = ev.streams[0];
      videoElem.onloadedmetadata = () => {
        this.content = "";
        videoElem.play();
      };
    }
  }

  // 网络协商
  sendCandidate(e: RTCPeerConnectionIceEvent) {
    if (e && e.candidate)
      ipcRenderer.send("forward", "sendPuppetCandidate", e.candidate.toJSON());
  }
  async addCandidate(e: any, candidate: RTCIceCandidateInit) {
    if (pc.remoteDescription && pc.remoteDescription.type) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  // 数据通道 控制指令传输
  sendDataCannel() {
    window.onkeydown = (e: KeyboardEvent) => {
      const data = {
        keyCode: e.keyCode,
        shift: e.shiftKey,
        meta: e.metaKey,
        control: e.ctrlKey,
        alt: e.altKey
      };
      dc.send(JSON.stringify({ type: "key", data }));
    };
    window.onmousemove = (e: MouseEvent) => {
      const data = {
        clientX: e.pageX,
        clientY: e.pageY,
        video: {
          width: this.$refs.video.getBoundingClientRect().width,
          height: this.$refs.video.getBoundingClientRect().height
        }
      };
      dc.send(JSON.stringify({ type: "move", data }));
    };
    window.onmouseup = (e: MouseEvent) => {
      const data = {
        clientX: e.clientX,
        clientY: e.clientY,
        video: {
          width: this.$refs.video.getBoundingClientRect().width,
          height: this.$refs.video.getBoundingClientRect().height
        }
      };
      dc.send(JSON.stringify({ type: "click", data }));
    };
  }
}
</script>

<style scoped lang="stylus">
@import '~@/assets/base.styl'

.control
  width 100%
  height 100%

  video
    margin 0
    padding 0
    height 100%
    object-fit fill

  .content
    position absolute
    top 0
    left 0
    right 0
    bottom 0
    color $bgc-font
    letter-spacing 4px
    background-color $bgc
    display flex
    justify-content center
    align-items center
</style>
