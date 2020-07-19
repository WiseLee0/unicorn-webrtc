<template>
  <div class="chat">
    <div class="title-row">
      <h2 class="title">群聊大厅</h2>
      <span>online {{nums}}</span>
      <i class="el-icon-circle-close" @click="onCloseSelf"></i>
    </div>
    <div class="container">
      <div>
        <div class="msg">
          <span class="name">小提示:</span>
          <div class="content">欢迎加入，快和大家打个招呼吧！</div>
        </div>
        <div
          v-for="(item,index) in msg"
          :class="data.name == item.name ? 'my-msg': 'msg'"
          :key="index"
        >
          <span class="name">{{item.name}}</span>
          <div class="content">{{item.content}}</div>
        </div>
        <div ref="bottom"></div>
      </div>
    </div>
    <div class="inputs">
      <el-input placeholder="请输入内容" v-model="content" @keyup.enter.native="sendMessage">
        <el-button slot="append" class="sendBtn" @click="sendMessage">发送</el-button>
      </el-input>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import BScroll from "@better-scroll/core";
import MouseWheel from "@better-scroll/mouse-wheel";
import ScrollBar from "@better-scroll/scroll-bar";
import { Input, Button } from "element-ui";
import { ipcRenderer } from "electron";
type TData = {
  label: string;
  name: string;
  receiveName: string[];
  nums: number;
};
BScroll.use(ScrollBar);
BScroll.use(MouseWheel);
@Component({
  components: {
    [Input.name]: Input,
    [Button.name]: Button
  }
})
export default class Chat extends Vue {
  @Prop() data!: TData;
  scroll!: BScroll;
  content = "";
  peerMap: Map<string, RTCPeerConnection> = new Map();
  dcMap: Map<string, RTCDataChannel> = new Map();
  remoteName = "";
  msg: any[] = []; // 消息
  nums = 0; // 房间在线人数
  created() {
    this.negotiation();
    this.nums = this.data.nums;
    ipcRenderer.on("join-nums", this.showNums);
    ipcRenderer.on("chat-close", this.onClose);
  }

  // 初始化滚动条
  mounted() {
    this.scroll = new BScroll(".container", {
      scrollY: true,
      scrollbar: true,
      mouseWheel: {
        speed: 20,
        invert: false,
        easeTime: 300
      }
    });
  }

  // 退出多人聊天
  async onCloseSelf() {
    for (const peer of this.peerMap) {
      await peer[1].close();
      ipcRenderer.send("forwardRoom", "chat-close", "", peer[0]);
    }
    ipcRenderer.send("myChat-close");
    location.reload();
  }

  async onClose(e: any, name: string) {
    if (this.peerMap.has(name)) {
      const pc = this.peerMap.get(name);
      await pc!.close();
      this.nums -= 1;
      this.peerMap.delete(name);
      this.dcMap.delete(name);
    }
  }

  // 发送信息
  @Watch("msg")
  watchMsg() {
    this.$nextTick(() => {
      this.scroll.refresh();
      this.scroll.scrollToElement(this.$refs.bottom, 200);
    });
  }
  sendMessage() {
    if (!this.content.length) return;
    const data = {
      name: this.data.name,
      content: this.content
    };
    this.msg.push(data);
    this.dcMap.forEach(dc => {
      dc.send(JSON.stringify(data));
    });
    this.content = "";
  }

  // 房间人数
  showNums(e: any, nums: number) {
    this.nums = nums;
  }

  // 多人 协商
  negotiation() {
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
      const dc = pc.createDataChannel("DataCannel", {
        ordered: true,
        maxRetransmits: 30,
        negotiated: true,
        id: 0
      });
      pc!.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
        if (e && e.candidate) {
          ipcRenderer.send(
            "forwardRoom",
            "sendPuppetCandidate",
            e.candidate.toJSON(),
            this.data.receiveName[i]
          );
        }
      };
      dc.onmessage = this.watchCannel;
      this.peerMap.set(this.data.receiveName[i], pc);
      this.dcMap.set(this.data.receiveName[i], dc);
    }
  }
  async sendOffer() {
    for (const peer of this.peerMap) {
      const pc = peer[1];
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await ipcRenderer.send(
        "forwardRoom",
        "puppet-offer",
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
    const dc = pc.createDataChannel("DataCannel", {
      ordered: true,
      maxRetransmits: 30,
      negotiated: true,
      id: 0
    });
    dc.onmessage = this.watchCannel;
    pc.onicecandidate = this.sendCandidate;
    this.remoteName = name;
    await pc.setRemoteDescription(JSON.parse(offer));
    await pc.setLocalDescription(await pc.createAnswer());
    await ipcRenderer.send(
      "forwardRoom",
      "puppet-answer",
      JSON.stringify(pc.localDescription),
      name
    );
    this.peerMap.set(name, pc);
    this.dcMap.set(name, dc);
  }
  async watchAnswer(e: any, answer: string, name: string) {
    this.remoteName = name;
    const pc = this.peerMap.get(name);
    await pc!.setRemoteDescription(JSON.parse(answer));
  }

  // 网络协商
  sendCandidate(e: RTCPeerConnectionIceEvent) {
    if (e && e.candidate && this.remoteName) {
      ipcRenderer.send(
        "forwardRoom",
        "sendPuppetCandidate",
        e.candidate.toJSON(),
        this.remoteName
      );
    }
  }
  async addCandidate(e: any, candidate: RTCIceCandidateInit, name: string) {
    const pc = this.peerMap.get(name)!;
    if (pc && pc!.remoteDescription && pc!.remoteDescription.type) {
      await pc!.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  // 监听数据通道
  watchCannel(e: MessageEvent) {
    const data = JSON.parse(e.data);
    this.msg.push(data);
  }
}
</script>

<style  lang="stylus">
@import '~@/assets/base.styl'

.chat
  margin-left 20px

  .title-row
    display flex
    flex-direction row
    justify-content space-between
    align-items center

    .title
      letter-spacing 2px
      color $font
      position relative

    .title::after
      content ''
      position absolute
      bottom -10px
      left 10px
      width 80px
      display block
      height 4px
      border-radius 8px
      background-color $font2

    span
      letter-spacing 2px
      font-family 'Times New Roman', Times, serif
      margin-top 10px
      font-size 18px
      color $font2

    .el-icon-circle-close
      color $font
      font-size 24px
      font-weight 700
      margin-right 15px
      margin-top 10px
      transition all 0.3s linear
      cursor pointer
      -webkit-app-region no-drag

    .el-icon-circle-close:hover
      transform scale(1.3)

  .container
    position relative
    width 350px
    height 220px
    padding-right 20px
    overflow hidden
    -webkit-app-region no-drag

    .msg
      display flex
      flex-direction row
      font-size 16px
      font-weight 700

      .content
        margin-top 5px
        margin-left 20px
        padding 5px 10px
        letter-spacing 2px
        border-radius 0 10px 10px 10px
        font-size 14px
        color $bgc-font
        background-color $bgc
        font-weight normal

    .my-msg
      display flex
      flex-direction row
      font-size 16px
      font-weight 700
      color $font2

      .content
        margin-top 5px
        margin-left 20px
        padding 5px 10px
        letter-spacing 2px
        border-radius 0 10px 10px 10px
        font-size 14px
        color $bgc
        background-color $bgc-font
        font-weight normal

  .inputs
    margin-top 10px
    -webkit-app-region no-drag
    opacity 0.6

    .el-input__inner
      border-radius 20px 0 0 0

    .el-input__inner:focus
      border-color $bgc-font

    .el-input-group__append
      border-radius 0 0 20px 0

    overflow hidden
</style>
