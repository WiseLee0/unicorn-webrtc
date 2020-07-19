<template>
  <div class="multiplayer">
    <div class="container">
      <div class="group" v-for="(item,index) in videoName" :key="index">
        <span>{{item}}</span>
        <video ref="videos"></video>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
type TData = {
  label: string;
  name: string;
  receiveName: string[];
  nums: number;
};
import { Component, Vue } from "vue-property-decorator";
import BScroll from "@better-scroll/core";
import MouseWheel from "@better-scroll/mouse-wheel";
import ScrollBar from "@better-scroll/scroll-bar";
import { ipcRenderer } from "electron";
BScroll.use(ScrollBar);
BScroll.use(MouseWheel);
@Component
export default class Multiplayer extends Vue {
  $refs!: {
    videos: HTMLVideoElement[];
  };
  data!: TData;
  remoteName = "";
  videoName: string[] = [];
  isTwice = false;
  localStream = false;
  scroll!: BScroll;
  peerMap: Map<string, RTCPeerConnection> = new Map();
  mounted() {
    this.init();
  }
  async init() {
    this.data = await ipcRenderer.invoke("multiplayerData");
    this.verifyFirst();
    this.notigation();
    this.scroll = new BScroll(".multiplayer", {
      scrollY: true,
      scrollbar: true,
      mouseWheel: {
        speed: 20,
        invert: false,
        easeTime: 300
      }
    });
    ipcRenderer.on("multiplayer-close", this.onClose);
  }

  // 其他人的退出
  async onClose(e: any, name: string) {
    console.log("close", name);
    if (this.peerMap.has(name)) {
      const pc = this.peerMap.get(name);
      await pc!.close();
      this.peerMap.delete(name);
      const index = this.videoName.findIndex(n => n == name);
      this.videoName.splice(index, 1);
    }
  }

  // 只有一个人，先初始化本地视频
  async verifyFirst() {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true
      },
      video: {
        width: 550,
        height: 400
      }
    });
    if (!this.localStream) {
      this.videoName.push(this.data.name);
      this.$nextTick(() => {
        this.scroll.refresh();
        const last = this.$refs.videos.length - 1;
        const video = this.$refs.videos[last];
        video.srcObject = mediaStream;
        video.onloadedmetadata = () => {
          video.play();
        };
      });
      this.localStream = true;
    }
  }

  // 媒体协商
  notigation() {
    this.createPeer();
    this.sendOffer();
    ipcRenderer.on("offer", this.watchOfferTosendAnswer);
    ipcRenderer.on("answer", this.watchAnswer);
    ipcRenderer.on("candidate", this.addCandidate);
  }
  createPeer() {
    for (let i = 0; i < this.data.receiveName.length; i++) {
      const pc = new RTCPeerConnection({
        iceServers: [
          {
            urls: "turn:188.131.221.100:3478",
            username: "wiselee",
            credential: "123456"
          }
        ]
      });
      pc!.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
        if (e && e.candidate) {
          ipcRenderer.send(
            "forwardRoom",
            "sendMultiplayerCandidate",
            e.candidate.toJSON(),
            this.data.receiveName[i]
          );
        }
      };
      pc.ontrack = this.onTrack;
      this.peerMap.set(this.data.receiveName[i], pc);
    }
  }
  async sendOffer() {
    for (const peer of this.peerMap) {
      const pc = peer[1];
      await this.addVideoStream(pc);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await ipcRenderer.send(
        "forwardRoom",
        "multiplayer-offer",
        JSON.stringify(offer),
        peer[0]
      );
    }
  }
  async watchOfferTosendAnswer(e: any, offer: string, name: string) {
    const pc = new window.RTCPeerConnection({
      iceServers: [
        {
          urls: "turn:188.131.221.100:3478",
          username: "wiselee",
          credential: "123456"
        }
      ]
    });
    pc.onicecandidate = this.sendCandidate;
    pc.ontrack = this.onTrack;
    this.remoteName = name;
    await this.addVideoStream(pc);
    await pc.setRemoteDescription(JSON.parse(offer));
    await pc.setLocalDescription(await pc.createAnswer());
    await ipcRenderer.send(
      "forwardRoom",
      "multiplayer-answer",
      JSON.stringify(pc.localDescription),
      name
    );
    this.peerMap.set(name, pc);
  }
  async watchAnswer(e: any, answer: string, name: string) {
    this.remoteName = name;
    const pc = this.peerMap.get(name);
    await pc!.setRemoteDescription(JSON.parse(answer));
  }

  // 添加视频流
  async addVideoStream(pc: RTCPeerConnection) {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true
      },
      video: {
        width: 550,
        height: 400
      }
    });
    if (!this.localStream) {
      this.videoName.push(this.data.name);
      this.$nextTick(() => {
        this.scroll.refresh();
        const last = this.$refs.videos.length - 1;
        const video = this.$refs.videos[last];
        video.srcObject = mediaStream;
        video.onloadedmetadata = () => {
          video.play();
        };
      });
      this.localStream = true;
    }
    mediaStream.getTracks().forEach((track: any) => {
      pc.addTrack(track, mediaStream);
    });
  }
  onTrack(ev: RTCTrackEvent) {
    if (ev && ev.streams[0] && !this.isTwice) {
      this.videoName.push(this.remoteName);
      this.$nextTick(() => {
        this.scroll.refresh();
        const last = this.$refs.videos.length - 1;
        const video = this.$refs.videos[last];
        video.srcObject = ev.streams[0];
        video.onloadedmetadata = () => {
          video.play();
        };
      });
      this.isTwice = true;
      return;
    }
    if (this.isTwice) {
      this.isTwice = false;
    }
  }

  // 网络协商
  sendCandidate(e: RTCPeerConnectionIceEvent) {
    if (e && e.candidate && this.remoteName) {
      ipcRenderer.send(
        "forwardRoom",
        "sendMultiplayerCandidate",
        e.candidate.toJSON(),
        this.remoteName
      );
    }
  }
  async addCandidate(e: any, candidate: RTCIceCandidateInit, name: string) {
    const pc = this.peerMap.get(name)!;
    if (pc && pc!.remoteDescription && pc!.remoteDescription.type) {
      console.log("candidate");
      await pc!.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }
}
</script>

<style scoped lang="stylus">
@import '~@/assets/base.styl'

.multiplayer
  position absolute
  top 0
  right 0
  left 0
  bottom 0
  background-color $bgc
  overflow hidden

  .container
    position relative
    display flex
    flex-direction row
    justify-content space-around
    flex-wrap wrap
    padding 20px

  .group
    position relative
    margin-bottom 20px

    span
      position absolute
      bottom 0
      left 0
      display block
      padding 5px 10px
      border-radius 0 10px 10px 10px
      color $font
      background-color $font2
      font-size 18px
      letter-spacing 3px
      font-family 'Times New Roman', Times, serif

    video
      width 550px
      height 400px
      border-radius 20px 20px 20px 0
</style>
