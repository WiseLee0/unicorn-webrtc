<template>
  <div class="screen" @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp">
    <img ref="img" :class="isMouseDown?'noBorder':''" />
    <div class="mask" :class="isMouseDown?'add':''"></div>
    <canvas ref="canvas"></canvas>
    <canvas ref="pixelCanvas"></canvas>
    <canvas ref="save" v-show="false"></canvas>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { ipcRenderer, clipboard } from "electron";
import fs from "fs";
import os from "os";
import path from "path";
type TPoint = {
  x: number;
  y: number;
};
@Component
export default class Screenshot extends Vue {
  dataURL = "";
  context!: CanvasRenderingContext2D;
  pixelContext!: CanvasRenderingContext2D;
  originPoint!: TPoint;
  currentPoint!: TPoint;
  isMouseDown = false; // 第一次截取
  isDraw = false; // 截取中
  pixel = "";
  $refs!: {
    img: HTMLImageElement;
    canvas: HTMLCanvasElement;
    pixelCanvas: HTMLCanvasElement;
    save: HTMLCanvasElement;
  };
  async created() {
    this.dataURL = await ipcRenderer.invoke("scrennshotData");
    this.init();
    window.addEventListener("keyup", this.onKeyUp, true);
  }

  // 初始化canvas
  init() {
    const { img, canvas, pixelCanvas } = this.$refs;
    img.src = this.dataURL;
    canvas.width = window.screen.width;
    canvas.height = window.screen.height;
    pixelCanvas.width = window.screen.width;
    pixelCanvas.height = window.screen.height;
    this.context = canvas.getContext("2d")!;
    this.pixelContext = canvas.getContext("2d")!;
    this.pixelContext.font = "14px Arial";
  }

  // 鼠标事件监听
  onMouseDown(e: MouseEvent) {
    e.preventDefault();
    this.originPoint = {
      x: e.clientX,
      y: e.clientY
    };
    this.isDraw = true;
    this.isMouseDown = true;
    this.drawRect();
  }
  async onMouseMove(e: MouseEvent) {
    e.preventDefault();
    this.currentPoint = {
      x: e.clientX,
      y: e.clientY
    };
    if (!this.isMouseDown) {
      this.pixel = await ipcRenderer.invoke("robotShot", this.currentPoint);
      this.drawPixelColor(this.pixel);
    }
    this.drawRect();
  }
  onMouseUp(e: MouseEvent) {
    e.preventDefault();
    this.isDraw = false;
  }
  onKeyUp(e: KeyboardEvent) {
    if (e.keyCode == 67 && !this.isMouseDown) {
      console.log("已复制");
      clipboard.writeText(`#${this.pixel}`);
    }
    if (e.keyCode == 32 && this.isMouseDown) {
      this.saveImage();
    }
    if (e.keyCode == 32 && !this.isMouseDown) {
      this.originPoint = {
        x: 0,
        y: 0
      };
      this.currentPoint = {
        x: window.screen.width,
        y: window.screen.height
      };
      this.saveImage();
    }
  }

  saveImage() {
    const { x, y } = this.originPoint;
    const { x: curX, y: curY } = this.currentPoint;
    const { save } = this.$refs;
    const w = curX - x;
    const h = curY - y;
    save.width = w;
    save.height = h;
    const context = this.$refs.save.getContext("2d")!;
    context.drawImage(this.$refs.img, x, y, w, h, 0, 0, w, h);
    const url = save.toDataURL();
    const base64Data = url.replace(/^data:image\/png;base64,/, "");
    const homedir = os.homedir();
    const rnd = Math.random()
      .toFixed(5)
      .slice(2);
    const p = path.join(homedir, "Desktop", `截图${rnd}.png`);
    fs.writeFileSync(p, base64Data, "base64");
    ipcRenderer.send("screenshot-close");
  }

  // 绘制选取框
  drawRect() {
    if (this.isDraw) {
      const { x, y } = this.originPoint;
      const { x: curX, y: curY } = this.currentPoint;
      this.context.clearRect(0, 0, window.screen.width, window.screen.height);
      this.context.strokeStyle = "#008c8c";
      this.context.lineWidth = 2;
      const w = curX - x;
      const h = curY - y;
      this.context.strokeRect(x, y, w, h);
      this.context.drawImage(this.$refs.img, x, y, w, h, x, y, w, h);
    }
  }

  // 绘制像素值
  drawPixelColor(pixel: string) {
    if (this.isMouseDown) return;
    const { x, y } = this.currentPoint;
    this.pixelContext.clearRect(
      0,
      0,
      window.screen.width,
      window.screen.height
    );
    this.pixelContext.fillStyle = "#333";
    this.pixelContext.fillRect(x, y + 30, 120, 150);
    this.pixelContext.drawImage(
      this.$refs.img,
      x - 10,
      y - 10,
      20,
      20,
      x,
      y + 30,
      120,
      80
    );
    this.pixelContext.beginPath();
    this.pixelContext.lineWidth = 2;
    this.pixelContext.strokeStyle = "#008c8c";
    this.pixelContext.moveTo(x + 60, y + 30);
    this.pixelContext.lineTo(x + 60, y + 110);
    this.pixelContext.moveTo(x, y + 30 + 40);
    this.pixelContext.lineTo(x + 120, y + 30 + 40);
    this.pixelContext.stroke();
    this.pixelContext.save();
    this.pixelContext.fillStyle = "#008c8c";
    this.pixelContext.fillText(`颜色值:#${pixel}`, x + 5, y + 130);
    this.pixelContext.fillText("按C复制色号", x + 5, y + 150);
    this.pixelContext.fillText("按空格完成截图", x + 5, y + 170);
  }
}
</script>

<style scoped lang="stylus">
.screen
  margin 0
  padding 0
  position absolute
  top 0
  left 0
  right 0
  bottom 0
  background-color #fff
  -webkit-app-region no-drag
  overflow hidden

  img
    width 100%
    height 100%
    box-sizing border-box
    border 4px solid #008c8c

  .noBorder
    border none

  .mask
    position absolute
    top 0
    left 0
    right 0
    bottom 0

  .add
    background-color rgba(0, 0, 0, 0.6)

  canvas
    position absolute
    top 0
    left 0
    right 0
    bottom 0
</style>
