<template>
  <div class="file">
    <span class="title">{{sendTitle}}</span>
    <span class="title">{{receiveTitle}}</span>
    <div class="upload" ref="upload" @dragover="stopDragover" @drop="onDropFile">
      <div class="receive">
        <el-progress
          class="progress"
          :text-inside="true"
          :stroke-width="18"
          :percentage="receivePercent"
        ></el-progress>
      </div>
      <div class="icon">
        <i class="el-icon-upload"></i>
        <span class="label">将文件拖到此处</span>
      </div>
      <div class="send">
        <el-progress
          class="progress"
          :text-inside="true"
          :stroke-width="18"
          :percentage="sendPercent"
        ></el-progress>
      </div>
    </div>
    <el-button type="primary" round class="btn" @click="onClose">断开传输</el-button>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import { Button, Progress } from "element-ui";
import { ipcRenderer } from "electron";
import fs from "fs";
import os from "os";
import path from "path";

type TData = {
  label: string;
  camp: string;
  remoteCode: string;
};
type TFile = {
  name: string;
  path: string;
  size: number;
};
type TDC = {
  label: string; // 文件 or 消息
  data?: ArrayBuffer; // 文件数据
  name?: string; // 文件名字
  size?: number; // 文件大小
  percent?: number; // 文件进度
  msg?: string; // 消息内容
};

@Component({
  components: {
    [Button.name]: Button,
    [Progress.name]: Progress
  }
})
export default class File extends Vue {
  @Prop() data!: TData;
  $refs!: {
    upload: HTMLElement;
  };
  sendTitle = "";
  receiveTitle = "";
  sendPercent = 0;
  receivePercent = 0;
  progress = 0;
  files: TFile[] = [];
  ws!: fs.WriteStream | null;
  rs!: fs.ReadStream;
  pc!: RTCPeerConnection;
  dc!: RTCDataChannel;
  created() {
    this.init();
    this.negotiation();
  }

  init() {
    this.pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: "turn:188.131.221.100:3478",
          username: "wiselee",
          credential: "123456"
        }
      ]
    });
    this.dc = this.pc.createDataChannel("fileDataCannel", {
      ordered: true,
      maxRetransmits: 30,
      negotiated: true,
      id: 0
    });
    this.dc.bufferedAmountLowThreshold = 1000;
    this.sendTitle = `给伙伴${this.data.remoteCode}发送文件吧...`;
    ipcRenderer.on("close", async () => {
      new Notification("提示", {
        body: "对方断开了与你的连接"
      });
      await this.pc.close();
      this.$emit("close");
    });
  }

  // 发送者 and 接收者 协商
  negotiation() {
    if (this.data.camp == "operate") {
      this.sendOffer();
      ipcRenderer.on("answer", this.watchAnswer);
    }
    if (this.data.camp == "receive") {
      ipcRenderer.on("offer", this.watchOfferTosendAnswer);
    }
    this.pc.onicecandidate = this.sendCandidate;
    ipcRenderer.on("candidate", this.addCandidate);
    this.dc.onmessage = this.watchCannel;
    this.dc.onbufferedamountlow = this.resumeCannel;
  }

  // 媒体协商
  async sendOffer() {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    ipcRenderer.send("forward", "puppet-offer", JSON.stringify(offer));
  }
  async watchOfferTosendAnswer(e: any, offer: string) {
    await this.pc.setRemoteDescription(JSON.parse(offer));
    await this.pc.setLocalDescription(await this.pc.createAnswer());
    ipcRenderer.send(
      "forward",
      "puppet-answer",
      JSON.stringify(this.pc.localDescription)
    );
  }
  async watchAnswer(e: any, answer: string) {
    await this.pc.setRemoteDescription(JSON.parse(answer));
  }

  // 网络协商
  sendCandidate(e: RTCPeerConnectionIceEvent) {
    if (e && e.candidate)
      ipcRenderer.send("forward", "sendPuppetCandidate", e.candidate.toJSON());
  }
  async addCandidate(e: any, candidate: RTCIceCandidateInit) {
    if (this.pc.remoteDescription && this.pc.remoteDescription.type) {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  // 数据通道
  watchCannel(e: MessageEvent) {
    const data: TDC = JSON.parse(e.data);
    // 接收到文件
    if (data.label == "file") {
      this._initWrite(data);
      this._writeFile(data);
      this._updateView(data);
    }
    // 接收到消息
    if (data.label == "message") {
      this._processRS(data);
    }
  }
  _initWrite(data: TDC) {
    if (!this.ws) {
      const homedir = os.homedir();
      const p = path.join(homedir, "Desktop", data.name!);
      this.ws = fs.createWriteStream(p);
      this.ws!.on("drain", () => {
        const send: TDC = {
          label: "message",
          msg: "resume"
        };
        this.dc.send(JSON.stringify(send));
      });
      this.ws!.on("finish", () => {
        new Notification("传输文件提示", {
          body: `已经成功接收对方的文件,${data.name}`
        });
      });
      this.sendTitle = "";
      this.receiveTitle = `正在接收${data.name}文件`;
    }
  }
  _writeFile(data: TDC) {
    const chunck = Buffer.from(data.data!);
    if (this.ws!.write(chunck) === false) {
      const send: TDC = {
        label: "message",
        msg: "pause"
      };
      this.dc.send(JSON.stringify(send));
    }
  }
  _processRS(data: TDC) {
    if (data.msg == "pause") {
      this.rs.pause();
    }
    if (data.msg == "resume") {
      if (this.rs.isPaused()) this.rs.resume();
    }
    if (data.msg == "readFinish") {
      this.receiveTitle = "接收文件完成";
      this.ws!.end();
      this.ws = null;
    }
  }
  _updateView(data: TDC) {
    this.receivePercent = data.percent || 0;
  }

  // 拖入文件信息
  onDropFile(e: DragEvent) {
    e.preventDefault();
    const files = e.dataTransfer!.files;
    const tempArr = [];
    for (let i = 0; i < files.length; i++) {
      const file = files.item(i);
      tempArr.push({
        name: file!.name,
        path: file!.path,
        size: file!.size
      });
    }
    this.files = tempArr;
  }

  // 文件顺序远程发送
  @Watch("files", { deep: true })
  watchFiles(n: TFile[]) {
    if (!n.length) {
      this.sendTitle = "发送文件完成";
      return;
    }
    setTimeout(() => {
      this.sendRemoteFile();
    }, 200);
  }
  sendRemoteFile() {
    const { name, size, path } = this.files[0];
    const send: TDC = {
      name,
      size,
      label: "file"
    };
    this.sendTitle = `正在发送${name}文件`;
    this.rs = fs.createReadStream(path, { highWaterMark: 5 * 1024 });
    this.rs.on("data", chunck => {
      this.limitStream();
      this.progress += chunck.length;
      this.sendPercent = Math.ceil((this.progress / size) * 100);
      send.data = chunck;
      send.percent = this.sendPercent;
      this.dc.send(JSON.stringify(send));
    });
    this.rs.on("end", () => {
      const send: TDC = {
        label: "message",
        msg: "readFinish"
      };
      this.dc.send(JSON.stringify(send));
      this.progress = 0;
      this.files.shift();
    });
    this.rs.on("error", err => {
      console.log(err);
    });
  }

  // 数据通道限流，防止冲出buffer
  limitStream() {
    if (this.dc.bufferedAmount > 10000000) {
      this.rs.pause();
    }
  }
  resumeCannel() {
    if (this.rs.isPaused()) this.rs.resume();
  }

  // 断开与对方的传输
  async onClose() {
    ipcRenderer.send("forward", "operate-close");
    await this.pc.close();
    this.$emit("close");
  }

  // 阻止默认的拖拽事件
  stopDragover(e: DragEvent) {
    e.preventDefault();
  }
}
</script>

<style  lang="stylus">
@import '~@/assets/base.styl'

.file
  display flex
  flex-direction column
  margin-left 40px

  .title
    color $font
    width 300px
    font-size 18px
    margin-top 10px
    font-weight 700

  .upload
    margin-top 15px
    width 300px
    height 200px
    border none
    display flex
    flex-direction column
    justify-content space-between
    border-radius 20px
    background-color $bgc
    -webkit-app-region no-drag

    .icon
      display flex
      flex-direction column
      align-items center

      .el-icon-upload
        font-size 75px
        color $bgc-font

      .label
        font-size 16px
        margin-top 10px
        color $font2

    .send
      margin -1px 20px
      display flex
      flex-direction column

      .el-progress-bar__outer
        background-color $theme

      .el-progress-bar__inner
        background-color $bgc

      .el-progress-bar__innerText
        color $theme

    .receive
      margin -1px 20px
      display flex
      flex-direction column

      .el-progress-bar__outer
        background-color $bgc

      .el-progress-bar__inner
        background-color $theme

      .el-progress-bar__innerText
        color $bgc

  .btn
    width 200px
    background-color $bgc
    color $bgc-font
    border none
    letter-spacing 2px
    margin 10px auto
    -webkit-app-region no-drag
</style>
