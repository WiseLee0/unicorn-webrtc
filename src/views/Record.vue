<template>
  <div class="record"></div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { desktopCapturer, ipcRenderer } from "electron";
import fs from "fs";
import os, { type } from "os";
import path from "path";
@Component
export default class Record extends Vue {
  $refs!: {
    live: HTMLVideoElement;
  };
  ws!: fs.WriteStream;
  recorder!: MediaRecorder;
  created() {
    this.init();
    ipcRenderer.on("close", this.close);
    ipcRenderer.on("pause", this.pause);
    ipcRenderer.on("resume", this.resume);
  }
  async init() {
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
    const audioStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false
    });
    mediaStream.addTrack(audioStream.getAudioTracks()[0]);
    this.initWs();
    this.createRecorder(mediaStream);
  }
  initWs() {
    const homedir = os.homedir();
    const p = path.join(homedir, "Desktop", "录制视频.mp4");
    this.ws = fs.createWriteStream(p);
  }

  // 开始录屏
  createRecorder(stream: MediaStream) {
    this.recorder = new MediaRecorder(stream);
    this.recorder.start(1000);
    this.recorder.ondataavailable = event => {
      const blob = new Blob([event.data], {
        type: "video/mp4"
      });
      this.saveMedia(blob);
    };
  }
  saveMedia(blob: Blob) {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result && typeof reader.result !== "string") {
        const buffer = new Buffer(reader.result);
        this.ws.write(buffer);
      }
    };
    reader.readAsArrayBuffer(blob);
  }

  close() {
    this.ws.end();
    this.recorder.stop();
    new Notification("录制完成", {
      body: "视频存储在桌面"
    });
  }
  pause() {
    this.recorder.pause();
    new Notification("暂停录制", {
      body: "现在录制处于暂停状态"
    });
  }
  resume() {
    this.recorder.resume();
  }
}
</script>

<style scoped lang="stylus">
.record
  background-color #fff
  -webkit-app-region drag
</style>
