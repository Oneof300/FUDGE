namespace Fudge {
  import ƒ = FudgeCore;
  import ƒui = FudgeUserInterface;

  export interface ViewAnimationKey {
    key: ƒ.AnimationKey;
    path2D: Path2D;
    sequence: ViewAnimationSequence;
  }

  export interface ViewAnimationSequence {
    color: string;
    sequence: ƒ.AnimationSequence;
  }

  export interface ViewAnimationEvent {
    event: string;
    path2D: Path2D;
  }

  export interface ViewAnimationLabel {
    label: string;
    path2D: Path2D;
  }

  /**
   * TODO: add
   * @authors Lukas Scheuerle, HFU, 2019 | Jonas Plotzky, HFU, 2022
   */
  export class ViewAnimation extends View {
    public animation: ƒ.Animation;
    public controller: ControllerAnimation;
    public toolbar: HTMLDivElement;
    public graph: ƒ.Graph;
    
    private cmpAnimator: ƒ.ComponentAnimator;
    private node: ƒ.Node;
    private playbackTime: number;
    private selectedKey: ViewAnimationKey;
    private propertyList: HTMLDivElement;
    private sheet: ViewAnimationSheet;
    private time: ƒ.Time = new ƒ.Time();
    private idInterval: number;

    constructor(_container: ComponentContainer, _state: Object) {
      super(_container, _state);
      this.playbackTime = 0;
      this.setAnimation(null);
      this.createUserInterface();
      
      _container.on("resize", this.animate);
      this.dom.addEventListener(EVENT_EDITOR.FOCUS, this.hndEvent);
      this.dom.addEventListener(EVENT_EDITOR.ANIMATE, this.hndAnimate);
      this.dom.addEventListener(ƒui.EVENT.SELECT, this.hndSelect);
      this.dom.addEventListener(ƒui.EVENT.CONTEXTMENU, this.openContextMenu);
      this.dom.addEventListener(ƒui.EVENT.EXPAND, this.hndEvent);
      this.dom.addEventListener(ƒui.EVENT.COLLAPSE, this.hndEvent);
      this.dom.addEventListener(ƒui.EVENT.INPUT, this.hndEvent);
    }

    //#region  ContextMenu
    protected getContextMenu(_callback: ContextMenuCallback): Electron.Menu {
      const menu: Electron.Menu = new remote.Menu();
      let path: string[] = [];

      if (this.node != undefined) {
        let item: Electron.MenuItem;
        item = new remote.MenuItem({
          label: "Add Property",
          submenu: this.getNodeSubmenu(this.node, path, _callback)
        });
        menu.append(item);

        item = new remote.MenuItem({ label: "Delete Property", id: String(CONTEXTMENU.DELETE_PROPERTY), click: _callback, accelerator: "D" });
        menu.append(item);
      }
      

      return menu;
    }

    protected contextMenuCallback(_item: Electron.MenuItem, _window: Electron.BrowserWindow, _event: Electron.Event): void {
      let choice: CONTEXTMENU = Number(_item.id);
      ƒ.Debug.fudge(`MenuSelect | id: ${CONTEXTMENU[_item.id]} | event: ${_event}`);
        
      let path: string[];
      switch (choice) {
        case CONTEXTMENU.ADD_PROPERTY:
          path = _item["path"];
          this.controller.addPath(path);
          this.recreatePropertyList();
          this.animate();

          break;
        case CONTEXTMENU.DELETE_PROPERTY:
          let element: Element = document.activeElement;
          if (element.tagName == "BODY")
            return;
          
          path = [];
          while (element !== this.propertyList) {
            if (element instanceof ƒui.Details) {
              let summaryElement: Element = element.getElementsByTagName("SUMMARY")[0];
              path.unshift(summaryElement.innerHTML);
            }

            if (element instanceof ƒui.CustomElement) {
              let labelElement: Element = element.getElementsByTagName("LABEL")[0];
              path.unshift(labelElement.innerHTML);
            }

            element = element.parentElement;
          }
          this.controller.deletePath(path);
          this.recreatePropertyList();
          this.animate(this.controller.getOpenSequences());
          return;
      }
    }


    private getNodeSubmenu(_node: ƒ.Node, _path: string[], _callback: ContextMenuCallback): Electron.Menu {
      const menu: Electron.Menu = new remote.Menu();
      for (const anyComponent of ƒ.Component.subclasses) {
        //@ts-ignore
        _node.getComponents(anyComponent).forEach((component, index) => { // we need to get the attached componnents as array so we can reconstuct their path
          let path: string[] = Object.assign([], _path);
          path.push("components");
          path.push(component.type);
          path.push(index.toString());
          let item: Electron.MenuItem;
          item = new remote.MenuItem(
            { label: component.type, submenu: this.getMutatorSubmenu(component.getMutatorForAnimation(), path, _callback)}
          );
          menu.append(item);  
        });
      }

      for (const child of _node.getChildren()) {
        let path: string[] = Object.assign([], _path);
        path.push("children");
        path.push(child.name);
        let item: Electron.MenuItem;
        item = new remote.MenuItem(
          { label: child.name, submenu: this.getNodeSubmenu(child, path, _callback)}
        );
        menu.append(item);
      }

      return menu;
    }

    private getMutatorSubmenu(_mutator: ƒ.Mutator, _path: string[], _callback: ContextMenuCallback): Electron.Menu {
      const menu: Electron.Menu = new remote.Menu();
      for (const property in _mutator) {
        let item: Electron.MenuItem;
        let path: string[] = Object.assign([], _path);
        path.push(property);
        if (typeof _mutator[property] === "object") {
          item = new remote.MenuItem(
            { label: property, submenu: this.getMutatorSubmenu(_mutator[property], path, _callback) }
          );
        } else {
          item = new remote.MenuItem(
            { label: property, id: String(CONTEXTMENU.ADD_PROPERTY), click: _callback }
          );
          //@ts-ignore
          item.overrideProperty("path", path);
          }
        menu.append(item);
        }

      
      return menu;
    }
    //#endregion

    private createUserInterface(): void {
      this.toolbar = document.createElement("div");
      this.toolbar.id = "toolbar";
      this.toolbar.style.width = "300px";
      this.toolbar.style.height = "80px";
      this.toolbar.style.overflow = "hidden";
      this.fillToolbar(this.toolbar);
      this.toolbar.addEventListener("click", this.hndToolbarClick);
      
      this.sheet = new ViewAnimationSheetCurve(this); // TODO: stop using fixed values?
      this.sheet.scrollContainer.addEventListener("pointerdown", this.hndPointerDown);
      this.sheet.scrollContainer.addEventListener("pointermove", this.hndPointerMove);
    }

    private hndPointerDown = (_event: PointerEvent): void => {
      if (_event.buttons != 1 || this.idInterval != undefined) return;

      let obj: ViewAnimationLabel | ViewAnimationKey | ViewAnimationEvent = this.sheet.getObjectAtPoint(_event.offsetX, _event.offsetY);
      if (!obj) return;

      if (obj["label"]) {
        console.log(obj["label"]);
        // TODO: replace with editor events. use dispatch event from view?
        this.dom.dispatchEvent(new CustomEvent(ƒui.EVENT.SELECT, { detail: { name: obj["label"], time: this.animation.labels[obj["label"]] } }));
      }
      else if (obj["event"]) {
        console.log(obj["event"]);
        this.dom.dispatchEvent(new CustomEvent(ƒui.EVENT.SELECT, { detail: { name: obj["event"], time: this.animation.events[obj["event"]] } }));
      }
      else if (obj["key"]) {
        console.log(obj["key"]);
        this.dom.dispatchEvent(new CustomEvent(ƒui.EVENT.SELECT, { detail: obj }));
      }
    }

    private hndPointerMove = (_event: PointerEvent): void => {
      if (_event.buttons != 1 || this.idInterval != undefined || _event.offsetY > 50) return;
      _event.preventDefault();

    }

    private hndEvent = (_event: FudgeEvent): void => {
      switch (_event.type) {
        case EVENT_EDITOR.FOCUS:
          this.graph = _event.detail.graph;
          this.node = _event.detail.node;
          this.cmpAnimator = this.node?.getComponent(ƒ.ComponentAnimator);
          this.contextMenu = this.getContextMenu(this.contextMenuCallback.bind(this));
          this.setAnimation(this.cmpAnimator?.animation);
          break;
        case ƒui.EVENT.EXPAND:
        case ƒui.EVENT.COLLAPSE:
          this.animate(this.controller.getOpenSequences());
          break;
        case ƒui.EVENT.INPUT:
          if (_event.target instanceof ƒui.CustomElement) {
            this.controller.modifyKey(this.playbackTime, _event.target);
            this.animate(this.controller.getOpenSequences());
          }
          break;
      }
    }

    private setAnimation(_animation: ƒ.Animation): void {
      if (!_animation) {
        this.animation = undefined;
        this.dom.innerHTML = "select node with an attached component animator";
        return;
      }
      this.dom.innerHTML = "";
      this.dom.appendChild(this.toolbar);

      this.animation = _animation;

      this.recreatePropertyList();
      
      this.dom.appendChild(this.sheet.canvas);
      this.dom.appendChild(this.sheet.scrollContainer);
      this.sheet.scrollContainer.appendChild(this.sheet.scrollBody);

      this.animate(this.controller.getOpenSequences());
    }

    private recreatePropertyList(): void {
      let nodeMutator: ƒ.Mutator = this.animation.getMutated(this.playbackTime, 0, this.cmpAnimator.playback) || {};

      let newPropertyList: HTMLDivElement = ƒui.Generator.createInterfaceFromMutator(nodeMutator);
      if (this.dom.contains(this.propertyList))
        this.dom.replaceChild(newPropertyList, this.propertyList);
      else
        this.dom.appendChild(newPropertyList);
      this.propertyList = newPropertyList;

      this.controller = new ControllerAnimation(this.animation, this.propertyList);
      this.controller.updatePropertyList(nodeMutator);
    }

    private hndSelect = (_event: CustomEvent): void => {
      if ("key" in _event.detail) {
        this.selectedKey = _event.detail;
      }
    }

    private hndAnimate = (_event: FudgeEvent): void => {
      if (_event.detail.view instanceof ViewAnimationSheet)
        this.pause();
      this.playbackTime = _event.detail.data.playbackTime;

      let nodeMutator: ƒ.Mutator = this.cmpAnimator?.updateAnimation(this.playbackTime) || {};
      this.controller?.updatePropertyList(nodeMutator);
    }

    private animate = (_sequences?: ViewAnimationSequence[]): void => {
      this.dispatch(EVENT_EDITOR.ANIMATE, { bubbles: true, detail: { graph: this.graph, data: { playbackTime: this.playbackTime, sequences: _sequences } } });
    }

    private fillToolbar(_tb: HTMLElement): void { 
      let buttons: HTMLButtonElement[] = [];
      buttons.push(document.createElement("button"));
      buttons.push(document.createElement("button"));
      buttons.push(document.createElement("button"));
      buttons.push(document.createElement("button"));
      buttons.push(document.createElement("button"));
      buttons.push(document.createElement("button"));
      buttons.push(document.createElement("button"));
      buttons.push(document.createElement("button"));
      buttons.push(document.createElement("button"));
      buttons.push(document.createElement("button"));
      buttons[0].classList.add("fa", "fa-fast-backward", "start");
      buttons[1].classList.add("fa", "fa-backward", "back");
      buttons[2].classList.add("fa", "fa-play", "play");
      buttons[3].classList.add("fa", "fa-pause", "pause");
      buttons[4].classList.add("fa", "fa-forward", "forward");
      buttons[5].classList.add("fa", "fa-fast-forward", "end");
      buttons[6].classList.add("fa", "fa-file", "add-label");
      buttons[7].classList.add("fa", "fa-bookmark", "add-event");
      buttons[8].classList.add("fa", "fa-plus-square", "add-key");
      buttons[9].classList.add("fa", "fa-plus-square", "remove-key");
      buttons[0].id = "start";
      buttons[1].id = "back";
      buttons[2].id = "play";
      buttons[3].id = "pause";
      buttons[4].id = "forward";
      buttons[5].id = "end";
      buttons[6].id = "add-label";
      buttons[7].id = "add-event";
      buttons[8].id = "add-key";
      buttons[9].id = "remove-key";

      buttons[0].innerText = "start";
      buttons[1].innerText = "back";
      buttons[2].innerText = "play";
      buttons[3].innerText = "pause";
      buttons[4].innerText = "forward";
      buttons[5].innerText = "end";
      buttons[6].innerText = "add-label";
      buttons[7].innerText = "add-event";
      buttons[8].innerText = "add-key";
      buttons[9].innerText = "remove-key";

      for (let b of buttons) {
        _tb.appendChild(b);
      }

    }

    private hndToolbarClick = (_e: MouseEvent) => {
      // console.log("click", _e.target);
      let target: HTMLInputElement = <HTMLInputElement>_e.target;
      switch (target.id) {
        case "add-label":
          this.animation.labels[this.randomNameGenerator()] = this.playbackTime;
          this.animate();
          break;
        case "add-event":
          this.animation.setEvent(this.randomNameGenerator(), this.playbackTime);
          this.animate();
          break;
        case "add-key":
          // TODO: readd this look how it works in unity?
          // this.controller.addKeyToAnimationStructure(this.playbackTime);
          // this.sheet.setSequences(this.controller.getOpenSequences());       
          // this.redraw();
          break;
        case "remove-key":
          this.controller.deleteKey(this.selectedKey);
          this.animate(this.controller.getOpenSequences());
          break;
        case "start":
          this.playbackTime = 0;
          this.animate();
          break;
        case "back": // TODO: change to next key frame
          this.playbackTime = this.playbackTime -= 1000 / this.animation.fps; // stepsPerSecond;
          this.playbackTime = Math.max(this.playbackTime, 0);
          this.animate();
          break;
        case "play":
          if (this.idInterval == undefined) {
            this.time.set(this.playbackTime);
            this.idInterval = window.setInterval(() => {
              this.playbackTime = this.time.get() % this.animation.totalTime;
              this.animate();
            }, 1000 / this.animation.fps);
          }
          break;
        case "pause":
          this.pause();
          break;
        case "forward": // TODO: change to next key frame
          this.playbackTime = this.playbackTime += 1000 / this.animation.fps; // stepsPerSecond;
          this.playbackTime = Math.min(this.playbackTime, this.animation.totalTime);
          this.animate();
          break;
        case "end":
          this.playbackTime = this.animation.totalTime;
          this.animate();
          break;
        default:

          break;
      }
    }

    private pause(): void {
      window.clearInterval(this.idInterval);
      this.idInterval = undefined;
    }

    private randomNameGenerator(): string {
      let attr: string[] = ["red", "blue", "green", "pink", "yellow", "purple", "orange", "fast", "slow", "quick", "boring", "questionable", "king", "queen", "smart", "gold"];
      let anim: string[] = ["cow", "fish", "elephant", "cat", "dog", "bat", "chameleon", "caterpillar", "crocodile", "hamster", "horse", "panda", "giraffe", "lukas", "koala", "jellyfish", "lion", "lizard", "platypus", "scorpion", "penguin", "pterodactyl"];

      return attr[Math.floor(Math.random() * attr.length)] + "-" + anim[Math.floor(Math.random() * anim.length)];
    }
  }
}