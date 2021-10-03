namespace Fudge {
  import ƒ = FudgeCore;
  import ƒUi = FudgeUserInterface;
  import ƒAid = FudgeAid;

  /**
   * View the rendering of a graph in a viewport with an independent camera
   * @author Jirka Dell'Oro-Friedl, HFU, 2020
   */
  export class ViewRender extends View {
    private cmrOrbit: ƒAid.CameraOrbit;
    private viewport: ƒ.Viewport;
    private canvas: HTMLCanvasElement;
    private graph: ƒ.Node;

    constructor(_container: ComponentContainer, _state: JsonValue) {
      super(_container, _state);
      this.graph = <ƒ.Graph>ƒ.Project.resources[_state["graph"]];
      this.createUserInterface();

      let title: string = "● Use mousebuttons and ctrl-, shift- or alt-key to navigate view.\n";
      title += "● Click to select node, rightclick to select transformations.\n";
      title += "● Hold X, Y or Z to transform. Add shift-key to invert restriction.";
      this.dom.title = title;
      this.dom.tabIndex = 0;

      _container.on("resize", this.redraw);
      this.dom.addEventListener(ƒUi.EVENT.MUTATE, this.hndEvent);
      this.dom.addEventListener(EVENT_EDITOR.UPDATE, this.hndEvent);
      this.dom.addEventListener(EVENT_EDITOR.REFRESH, this.hndEvent);
      this.dom.addEventListener(ƒUi.EVENT.SELECT, this.hndEvent);
      this.dom.addEventListener(ƒUi.EVENT.DELETE, this.hndEvent);
      this.dom.addEventListener(EVENT_EDITOR.SET_PROJECT, this.hndEvent, true);
      this.dom.addEventListener(EVENT_EDITOR.SET_GRAPH, this.hndEvent);
      this.dom.addEventListener(EVENT_EDITOR.FOCUS_NODE, this.hndEvent);
      this.dom.addEventListener(ƒUi.EVENT.CONTEXTMENU, this.openContextMenu);
      this.dom.addEventListener("pointermove", this.hndPointer);
    }

    createUserInterface(): void {
      let cmpCamera: ƒ.ComponentCamera = new ƒ.ComponentCamera();
      // cmpCamera.pivot.translate(new ƒ.Vector3(3, 2, 1));
      // cmpCamera.pivot.lookAt(ƒ.Vector3.ZERO());
      cmpCamera.projectCentral(1, 45);
      this.canvas = ƒAid.Canvas.create(true, ƒAid.IMAGE_RENDERING.PIXELATED);
      let container: HTMLDivElement = document.createElement("div");
      container.style.borderWidth = "0px";
      document.body.appendChild(this.canvas);
      // this.dom.append(this.canvas);

      this.viewport = new ƒ.Viewport();
      this.viewport.initialize("ViewNode_Viewport", this.graph, cmpCamera, this.canvas);
      this.cmrOrbit = FudgeAid.Viewport.expandCameraToInteractiveOrbit(this.viewport, false);
      // this.viewport.draw();

      this.setGraph(null);

      // ƒ.Loop.start(ƒ.LOOP_MODE.TIME_REAL);
      // ƒ.Loop.addEventListener(ƒ.EVENT.LOOP_FRAME, this.animate);

      //Focus cameracontrols on new viewport
      // let event: CustomEvent = new CustomEvent(EVENT_EDITOR.ACTIVATE_VIEWPORT, { detail: this.viewport.camera, bubbles: false });

      this.canvas.addEventListener(ƒUi.EVENT.CLICK, this.activeViewport);
      this.canvas.addEventListener("pick", this.hndPick);
    }

    public setGraph(_node: ƒ.Node): void {
      if (!_node) {
        this.graph = undefined;
        this.dom.innerHTML = "Drop a graph here to edit";
        return;
      }
      if (!this.graph) {
        this.dom.innerHTML = "";
        this.dom.appendChild(this.canvas);
      }
      this.graph = _node;
      this.viewport.setBranch(this.graph);
      this.redraw();
    }

    //#region  ContextMenu
    protected getContextMenu(_callback: ContextMenuCallback): Electron.Menu {
      const menu: Electron.Menu = new remote.Menu();
      let item: Electron.MenuItem;

      item = new remote.MenuItem({ label: "Translate", id: TRANSFORM.TRANSLATE, click: _callback, accelerator: process.platform == "darwin" ? "T" : "T" });
      menu.append(item);
      item = new remote.MenuItem({ label: "Rotate", id: TRANSFORM.ROTATE, click: _callback, accelerator: process.platform == "darwin" ? "R" : "R" });
      menu.append(item);
      item = new remote.MenuItem({ label: "Scale", id: TRANSFORM.SCALE, click: _callback, accelerator: process.platform == "darwin" ? "E" : "E" });
      menu.append(item);
      return menu;
    }

    protected contextMenuCallback(_item: Electron.MenuItem, _window: Electron.BrowserWindow, _event: Electron.Event): void {
      ƒ.Debug.info(`MenuSelect: Item-id=${CONTEXTMENU[_item.id]}`);

      switch (_item.id) {
        case TRANSFORM.TRANSLATE:
        case TRANSFORM.ROTATE:
        case TRANSFORM.SCALE:
          Page.setTransform(_item.id);
      }
    }
    //#endregion

    protected hndDragOver(_event: DragEvent, _viewSource: View): void {
      _event.dataTransfer.dropEffect = "none";
      // if (this.dom != _event.target)
      //   return;

      if (!(_viewSource instanceof ViewInternal))
        return;

      let source: Object = _viewSource.getDragDropSources()[0];
      if (!(source instanceof ƒ.Graph))
        return;

      _event.dataTransfer.dropEffect = "link";
      _event.preventDefault();
      _event.stopPropagation();
    }

    protected hndDrop(_event: DragEvent, _viewSource: View): void {
      let source: Object = _viewSource.getDragDropSources()[0];
      // this.setGraph(<ƒ.Node>source);
      this.dom.dispatchEvent(new CustomEvent(EVENT_EDITOR.SET_GRAPH, { bubbles: true, detail: source }));
    }

    private hndEvent = (_event: CustomEvent): void => {
      switch (_event.type) {
        case EVENT_EDITOR.CLEAR_PROJECT:
          this.setGraph(null);
          break;
        case EVENT_EDITOR.SET_GRAPH:
          this.setGraph(_event.detail);
          break;
        case EVENT_EDITOR.FOCUS_NODE:
          this.cmrOrbit.mtxLocal.translation = _event.detail.mtxWorld.translation;
          ƒ.Render.prepare(this.cmrOrbit);
        // break;
        case ƒUi.EVENT.MUTATE:
        case ƒUi.EVENT.DELETE:
        case EVENT_EDITOR.UPDATE:
        case EVENT_EDITOR.REFRESH:
          this.redraw();
      }
    }

    private hndPick = (_event: CustomEvent): void => {
      let picked: ƒ.Node = _event.detail.node;

      // this.dom.dispatchEvent(new CustomEvent(EVENT_EDITOR.FOCUS_NODE, { bubbles: true, detail: picked }));
      this.dom.dispatchEvent(new CustomEvent(ƒUi.EVENT.SELECT, { bubbles: true, detail: { data: picked } }));
    }

    // private animate = (_e: Event) => {
    //   this.viewport.setGraph(this.graph);
    //   if (this.canvas.clientHeight > 0 && this.canvas.clientWidth > 0)
    //     this.viewport.draw();
    // }

    private hndPointer = (_event: PointerEvent): void => {
      this.dom.focus();
      let restriction: string;
      if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.X]))
        restriction = "x";
      else if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.Y]))
        restriction = "z";
      else if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.Z]))
        restriction = "y";

      if (!restriction)
        return;

      this.canvas.requestPointerLock();
      let detail: Object = {
        transform: Page.modeTransform, restriction: restriction, x: _event.movementX, y: _event.movementY, camera: this.viewport.camera
      };
      this.dom.dispatchEvent(new CustomEvent(EVENT_EDITOR.TRANSFORM, { bubbles: true, detail: detail }));
      this.redraw();
    }

    private activeViewport = (_event: MouseEvent): void => {
      // let event: CustomEvent = new CustomEvent(EVENT_EDITOR.ACTIVATE_VIEWPORT, { detail: this.viewport.camera, bubbles: false });
      _event.cancelBubble = true;
    }

    private redraw = () => {
      try {
        this.viewport.draw();
      } catch (_error: unknown) {
        //nop
      }
    }
  }
}
