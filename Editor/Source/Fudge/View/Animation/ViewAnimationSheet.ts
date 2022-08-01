namespace Fudge {
  import ƒ = FudgeCore;
  import ƒui = FudgeUserInterface;
  

  export interface ViewAnimationSlopeHook {
    position: ƒ.Vector2;
    path2D: Path2D;
  }
  /**
   * TODO: add
   * @authors Lukas Scheuerle, HFU, 2019 | Jonas Plotzky, HFU, 2022
   */
  export abstract class ViewAnimationSheet extends View {
    protected static readonly KEY_SIZE: number = 6; // width and height in px
    private static readonly LINE_WIDTH: number = 1; // in px
    private static readonly TIMELINE_HEIGHT: number = 50; // in px
    private static readonly PIXEL_PER_MILLISECOND: number = 1; // at scaling 1
    private static readonly PIXEL_PER_VALUE: number = 100; // at scaling 1
    private static readonly STANDARD_ANIMATION_LENGTH: number = 1000; // in miliseconds, used when animation length is falsy
    
    protected canvas: HTMLCanvasElement;
    protected crc2: CanvasRenderingContext2D;
    protected mtxWorldToScreen: ƒ.Matrix3x3;
    protected mtxScreenToWorld: ƒ.Matrix3x3;
    protected selectedKey: ViewAnimationKey;

    protected keys: ViewAnimationKey[] = [];
    protected sequences: ViewAnimationSequence[] = [];

    private graph: ƒ.Graph;
    private animation: ƒ.Animation;
    private playbackTime: number = 0;

    private scrollContainer: HTMLDivElement;
    private scrollBody: HTMLDivElement;
    private labels: ViewAnimationLabel[] = [];
    private events: ViewAnimationEvent[] = [];
    private slopeHooks: ViewAnimationSlopeHook[];
    private posDragStart: ƒ.Vector2 = new ƒ.Vector2();

    private isAdjustingSlope: boolean = false;

    constructor(_container: ComponentContainer, _state: Object) {
      super(_container, _state);

      _container.on("resize", () => this.redraw());
      this.dom.addEventListener(EVENT_EDITOR.FOCUS, this.hndFocus);
      this.dom.addEventListener(EVENT_EDITOR.ANIMATE, this.hndAnimate);
      this.dom.addEventListener(EVENT_EDITOR.SELECT, this.hndSelect);

      this.canvas = document.createElement("canvas");
      this.canvas.style.position = "absolute";
      this.crc2 = this.canvas.getContext("2d");
      this.mtxWorldToScreen = new ƒ.Matrix3x3();
      this.mtxScreenToWorld = new ƒ.Matrix3x3();

      this.scrollContainer = document.createElement("div");
      this.scrollContainer.style.position = "absolute";
      this.scrollContainer.style.width = "100%";
      this.scrollContainer.style.height = "100%";
      this.scrollContainer.style.overflowX = "scroll";
      this.scrollContainer.style.scrollBehavior = "instant";
      this.scrollContainer.addEventListener("pointerdown", this.hndPointerDown);
      this.scrollContainer.addEventListener("pointermove", this.hndPointerMove);
      this.scrollContainer.addEventListener("pointerup", this.hndPointerUp);
      this.scrollContainer.addEventListener("wheel", this.hndWheel);

      this.scrollBody = document.createElement("div");
      this.scrollBody.style.overflow = "hidden";
      this.scrollBody.style.height = "1px";

      this.dom.appendChild(this.canvas);
      this.dom.appendChild(this.scrollContainer);
      this.scrollContainer.appendChild(this.scrollBody);
    }

    //#region drawing
    public redraw(_scroll: boolean = true, _time?: number): void {
      this.canvas.width = this.dom.clientWidth;
      this.canvas.height = this.dom.clientHeight;
      
      if (_time != undefined) this.playbackTime = _time;
      
      let translation: ƒ.Vector2 = this.mtxWorldToScreen.translation;
      translation.x = Math.min(0, translation.x);
      this.mtxWorldToScreen.translation = translation;
      this.mtxScreenToWorld = ƒ.Matrix3x3.INVERSION(this.mtxWorldToScreen);

      if (_scroll) {
        let timelineLength: number = this.canvas.width * this.mtxScreenToWorld.scaling.x + this.mtxScreenToWorld.translation.x; // in miliseconds
        let animationLength: number = this.animation?.totalTime || 0;
        if (timelineLength - animationLength > 0) {
          this.scrollBody.style.width = `${this.canvas.width - this.mtxWorldToScreen.translation.x}px`;
        } else {
          this.scrollBody.style.width = `${animationLength * 1.2 * this.mtxWorldToScreen.scaling.x}px`;
        }
        this.scrollContainer.scrollLeft = -this.mtxWorldToScreen.translation.x;
      }

      if (this.animation) {
        if (this instanceof ViewAnimationSheetCurve) {
          this.drawCurves();
          this.drawScale();
        }
        this.drawKeys();
        this.crc2.lineWidth = ViewAnimationSheet.LINE_WIDTH;
        this.drawTimeline();
        this.drawEventsAndLabels();
        this.drawCursor();
      }
    }

    protected drawTimeline(): void {
      this.crc2.fillStyle = window.getComputedStyle(this.dom).getPropertyValue("--color-background-content");
      this.crc2.fillRect(0, 0, this.canvas.width, ViewAnimationSheet.TIMELINE_HEIGHT + 30);

      this.crc2.fillStyle = window.getComputedStyle(this.dom).getPropertyValue("--color-background-main");
      let animationWidth: number = this.animation.totalTime * this.mtxWorldToScreen.scaling.x + this.mtxWorldToScreen.translation.x;
      this.crc2.fillRect(0, 0, animationWidth, ViewAnimationSheet.TIMELINE_HEIGHT + 30);
      
      let timeline: Path2D = new Path2D();
      timeline.moveTo(0, ViewAnimationSheet.TIMELINE_HEIGHT);
      timeline.lineTo(this.canvas.width, ViewAnimationSheet.TIMELINE_HEIGHT);

      this.crc2.fillStyle = window.getComputedStyle(this.dom).getPropertyValue("--color-text");
      this.crc2.strokeStyle = window.getComputedStyle(this.dom).getPropertyValue("--color-text");
      this.crc2.textBaseline = "middle";
      this.crc2.textAlign = "left";

      const minimumPixelPerStep: number = 10;
      let pixelPerFrame: number = 1000 / this.animation.fps;
      let pixelPerStep: number = pixelPerFrame * this.mtxWorldToScreen.scaling.x;
      let framesPerStep: number = 1;
      let stepScaleFactor: number = Math.max(
        Math.pow(2, Math.ceil(Math.log2(minimumPixelPerStep / pixelPerStep))), 
        1);
      pixelPerStep *= stepScaleFactor;
      framesPerStep *= stepScaleFactor;

      let steps: number = 1 + this.canvas.width / pixelPerStep;
      let stepOffset: number = Math.floor(-this.mtxWorldToScreen.translation.x / pixelPerStep);
      for (let iStep: number = stepOffset; iStep < steps + stepOffset; iStep++) {
        let x: number = (iStep * pixelPerStep + this.mtxWorldToScreen.translation.x);
        timeline.moveTo(x, ViewAnimationSheet.TIMELINE_HEIGHT);
        // TODO: refine the display
        if (iStep % 5 == 0) {
          timeline.lineTo(x, ViewAnimationSheet.TIMELINE_HEIGHT - 30);
          let second: number = Math.floor((iStep * framesPerStep) / this.animation.fps);
          let frame: number = (iStep * framesPerStep) % this.animation.fps;
          this.crc2.fillText(
            `${second}:${frame < 10 ? "0" : ""}${frame}`, 
            x + 3, 
            ViewAnimationSheet.TIMELINE_HEIGHT - 30);
        } else {
          timeline.lineTo(x, ViewAnimationSheet.TIMELINE_HEIGHT - 20);
        }
      }

      this.crc2.stroke(timeline);
    }

    protected drawKeys(): void {
      this.generateKeys();
      
      for (const key of this.keys) {
        this.crc2.lineWidth = 4;
        this.crc2.strokeStyle = key.key == this.selectedKey?.key ? 
          window.getComputedStyle(this.dom).getPropertyValue("--color-signal") : 
          window.getComputedStyle(this.dom).getPropertyValue("--color-medium");
        this.crc2.fillStyle = key.sequence.color;

        this.crc2.stroke(key.path2D);
        this.crc2.fill(key.path2D);

        if (key.key == this.selectedKey?.key) {
          this.crc2.lineWidth = ViewAnimationSheet.LINE_WIDTH;
          this.crc2.strokeStyle = window.getComputedStyle(this.dom).getPropertyValue("--color-medium");
          this.crc2.fillStyle = this.crc2.strokeStyle;

          let [left, right] = [ƒ.Recycler.get(ƒ.Vector2), ƒ.Recycler.get(ƒ.Vector2)];
          left.set(-50, 0);
          right.set(50, 0);

          let angle: number = Math.atan(key.key.SlopeIn * (this.mtxWorldToScreen.scaling.y / this.mtxWorldToScreen.scaling.x)) * (180 / Math.PI);
          let mtxTransform: ƒ.Matrix3x3 = ƒ.Matrix3x3.IDENTITY();
          mtxTransform.translate(key.posScreen);
          mtxTransform.rotate(angle);
          left.transform(mtxTransform);
          right.transform(mtxTransform);

          let path: Path2D = new Path2D();
          path.moveTo(left.x, left.y);
          path.lineTo(right.x, right.y);
          this.crc2.stroke(path);
          this.slopeHooks = [{position: left, path2D: this.generateKey(left.x, left.y, 5, 5)}, {position: right, path2D: this.generateKey(right.x, right.y, 5, 5)}];
          this.slopeHooks.forEach( _hook => this.crc2.fill(_hook.path2D));

          ƒ.Recycler.store(left);
          ƒ.Recycler.store(right);
        }
      }
    }

    protected abstract generateKeys(): void;

    protected generateKey(_x: number, _y: number, _w: number, _h: number): Path2D {
      let key: Path2D = new Path2D();
      key.moveTo(_x - _w, _y);
      key.lineTo(_x, _y + _h);
      key.lineTo(_x + _w, _y);
      key.lineTo(_x, _y - _h);
      key.closePath();
      return key;
    }

    private drawCursor(): void {
      this.crc2.strokeStyle = window.getComputedStyle(this.dom).getPropertyValue("--color-signal");
      let x: number = this.playbackTime * this.mtxWorldToScreen.scaling.x + this.mtxWorldToScreen.translation.x;
      let cursor: Path2D = new Path2D();
      cursor.moveTo(x, 0);
      cursor.lineTo(x, this.canvas.height);
      this.crc2.strokeStyle = "white";
      this.crc2.stroke(cursor);
    }

    private drawEventsAndLabels(): void {
      let maxDistance: number = 10000;
      let labelDisplayHeight: number = 30 + 50;
      let line: Path2D = new Path2D();
      line.moveTo(0, labelDisplayHeight);
      line.lineTo(maxDistance, labelDisplayHeight);

      this.crc2.strokeStyle = window.getComputedStyle(this.dom).getPropertyValue("--color-text");
      this.crc2.fillStyle = window.getComputedStyle(this.dom).getPropertyValue("--color-text");
      this.crc2.stroke(line);

      this.labels = [];
      this.events = [];
      if (!this.animation) return;
      for (let l in this.animation.labels) {
        //TODO stop using hardcoded values
        let p: Path2D = new Path2D;
        this.labels.push({ label: l, path2D: p });
        let position: number = this.animation.labels[l] * this.mtxWorldToScreen.scaling.x + this.mtxWorldToScreen.translation.x;
        p.moveTo(position - 3, labelDisplayHeight - 26);
        p.lineTo(position - 3, labelDisplayHeight - 4);
        p.lineTo(position + 3, labelDisplayHeight - 4);
        p.lineTo(position + 3, labelDisplayHeight - 23);
        p.lineTo(position, labelDisplayHeight - 26);
        p.lineTo(position - 3, labelDisplayHeight - 26);
        this.crc2.fill(p);
        this.crc2.stroke(p);
        let p2: Path2D = new Path2D();
        p2.moveTo(position, labelDisplayHeight - 26);
        p2.lineTo(position, labelDisplayHeight - 23);
        p2.lineTo(position + 3, labelDisplayHeight - 23);
        this.crc2.stroke(p2);
      }
      for (let e in this.animation.events) {
        let p: Path2D = new Path2D;
        this.events.push({ event: e, path2D: p });
        let position: number = this.animation.events[e] * this.mtxWorldToScreen.scaling.x + this.mtxWorldToScreen.translation.x;
        p.moveTo(position - 3, labelDisplayHeight - 26);
        p.lineTo(position - 3, labelDisplayHeight - 7);
        p.lineTo(position, labelDisplayHeight - 4);
        p.lineTo(position + 3, labelDisplayHeight - 7);
        p.lineTo(position + 3, labelDisplayHeight - 26);
        p.lineTo(position - 3, labelDisplayHeight - 26);
        // this.crc2.fill(p);
        this.crc2.stroke(p);
      }
    }
    //#endregion

    //#region events
    private hndFocus = (_event: FudgeEvent): void => {
      this.graph = _event.detail.graph;
      this.animation = _event.detail.node?.getComponent(ƒ.ComponentAnimator)?.animation;
      this.mtxWorldToScreen.reset();
      this.mtxWorldToScreen.scaleY(-ViewAnimationSheet.PIXEL_PER_VALUE); // flip y, apply scaling
      this.mtxWorldToScreen.scaleX(ViewAnimationSheet.PIXEL_PER_MILLISECOND);
      this.mtxScreenToWorld = ƒ.Matrix3x3.INVERSION(this.mtxWorldToScreen);
      if (this.animation) {
        this.setTime(0);
        // TODO: adjust y scaling to fit highest and lowest key
        let translation: ƒ.Vector2 = this.mtxWorldToScreen.translation;
        translation.y = this.canvas.height / 2;
        this.mtxWorldToScreen.translation = translation;
        let scaling: ƒ.Vector2 = this.mtxWorldToScreen.scaling;
        scaling.x = this.canvas.width / ((this.animation.totalTime || ViewAnimationSheet.STANDARD_ANIMATION_LENGTH) * 1.2);
        this.mtxWorldToScreen.scaling = scaling;
      }
      this.redraw();
    }

    private hndAnimate = (_event: FudgeEvent): void => {
      this.playbackTime = _event.detail.data.playbackTime || 0;
      this.sequences = _event.detail.data.sequences || this.sequences;

      this.redraw();
    }

    private hndSelect = (_event: FudgeEvent): void => {
      this.selectedKey = null;
      if (_event.detail.data && "key" in _event.detail.data) {
        this.selectedKey = _event.detail.data;
      }
      this.redraw(false);
    }

    private hndPointerDown = (_event: PointerEvent): void => {
      _event.preventDefault();
      switch (_event.buttons) {
        case 1:
          if (_event.offsetY > (<HTMLElement>_event.target).clientHeight) // clicked on scroll bar
            this.scrollContainer.onscroll = this.hndScroll;
          else if (_event.offsetY <= ViewAnimationSheet.TIMELINE_HEIGHT)
            this.setTime(_event.offsetX);
          else if (this.slopeHooks && this.slopeHooks.some(_hook => this.crc2.isPointInPath(_hook.path2D, _event.offsetX, _event.offsetY))) {
            this.isAdjustingSlope = true;
          } else {
            let x: number = _event.offsetX;
            let y: number = _event.offsetY;
            const findObject: (_object: ViewAnimationKey | ViewAnimationLabel | ViewAnimationEvent) => boolean = _object => this.crc2.isPointInPath(_object.path2D, x, y);
            let obj: ViewAnimationKey | ViewAnimationLabel | ViewAnimationEvent =
              this.keys.find(findObject) ||
              this.labels.find(findObject) ||
              this.events.find(findObject);

            if (!obj) {
              this.dispatch(EVENT_EDITOR.SELECT, { bubbles: true, detail: { data: null } });
              return;
            } 

            if (obj["label"]) {
              console.log(obj["label"]);
              this.dispatch(EVENT_EDITOR.SELECT, { bubbles: true, detail: { data: { name: obj["label"], time: this.animation.labels[obj["label"]] } } });
            }
            else if (obj["event"]) {
              console.log(obj["event"]);
              this.dispatch(EVENT_EDITOR.SELECT, { bubbles: true, detail: { data: { name: obj["event"], time: this.animation.events[obj["event"]] } } });
            }
            else if (obj["key"]) {
              console.log(obj["key"]);
              this.dispatch(EVENT_EDITOR.SELECT, { bubbles: true, detail: { data: obj } });
            }
          }
          break;
        case 4:
          this.posDragStart = this.getScreenToWorldPoint(_event.offsetX, _event.offsetY);
          break;
      }
    }

    private hndPointerMove = (_event: PointerEvent): void => {
      _event.preventDefault();
      switch (_event.buttons) {
        case 1:
          if (_event.offsetY <= ViewAnimationSheet.TIMELINE_HEIGHT) 
            this.setTime(_event.offsetX);
          else if (this.isAdjustingSlope) {
            let vctDelta: ƒ.Vector2 = ƒ.Vector2.DIFFERENCE(new ƒ.Vector2(_event.offsetX, _event.offsetY), this.selectedKey.posScreen);
            vctDelta.transform(ƒ.Matrix3x3.SCALING(this.mtxScreenToWorld.scaling));
            let slope: number = vctDelta.y / vctDelta.x;
            this.selectedKey.key.SlopeIn = slope;
            this.selectedKey.key.SlopeOut = slope;
            this.dispatch(EVENT_EDITOR.ANIMATE, { bubbles: true, detail: { graph: this.graph, data: { playbackTime: this.playbackTime } } });
          }
          break;
        case 4:
          this.mtxWorldToScreen.translate(ƒ.Vector2.DIFFERENCE(this.getScreenToWorldPoint(_event.offsetX, _event.offsetY), this.posDragStart));
          this.redraw();
          break;
      }
    }

    private hndPointerUp = (_event: PointerEvent): void => {
      _event.preventDefault();

      if (this.scrollContainer.onscroll) {
        this.scrollContainer.onscroll = undefined;
      }

      if (this.isAdjustingSlope) {
        this.isAdjustingSlope = false;
      }

      this.redraw();
    }

    private hndWheel = (_event: WheelEvent) => {
      _event.preventDefault();
      if (_event.buttons != 0) return;
      let zoomFactor: number = _event.deltaY < 0 ? 1.05 : 0.95;
      let posCursorTransformed: ƒ.Vector2 = this.getScreenToWorldPoint(_event.offsetX, _event.offsetY);
      
      this.mtxWorldToScreen.translate(posCursorTransformed);
      this.mtxWorldToScreen.scale(new ƒ.Vector2(_event.shiftKey ? 1 : zoomFactor, _event.ctrlKey ? 1 : zoomFactor));
      this.mtxWorldToScreen.translate(ƒ.Vector2.SCALE(posCursorTransformed, -1));

      this.redraw();
    }

    private hndScroll = (_event: Event) => {
      _event.preventDefault();
      let translation: ƒ.Vector2 = this.mtxWorldToScreen.translation;
      translation.x = -this.scrollContainer.scrollLeft;
      this.mtxWorldToScreen.translation = translation;
      this.redraw(false);
    }
    //#endregion

    private setTime(_x: number): void {
      let playbackTime: number = Math.max(0, this.getScreenToWorldPoint(_x, 0).x);
      let pixelPerFrame: number = 1000 / this.animation.fps;
      playbackTime = Math.round(playbackTime / pixelPerFrame) * pixelPerFrame;
      this.dispatch(EVENT_EDITOR.ANIMATE, { bubbles: true, detail: { graph: this.graph, data: { playbackTime: playbackTime } } });
    }

    private getScreenToWorldPoint(_x: number, _y: number): ƒ.Vector2 {
      let vector: ƒ.Vector2 = new ƒ.Vector2(_x, _y);
      vector.transform(this.mtxScreenToWorld);
      return vector;
    }
  }
}

