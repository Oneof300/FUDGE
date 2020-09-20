///<reference path="../../../node_modules/electron/Electron.d.ts"/>
///<reference types="../../../Core/Build/FudgeCore"/>
///<reference types="../../../Aid/Build/FudgeAid"/>
///<reference types="../../../UserInterface/Build/FudgeUserInterface"/>

namespace Fudge {

  import ƒ = FudgeCore;
  import ƒAid = FudgeAid;

  export const ipcRenderer: Electron.IpcRenderer = require("electron").ipcRenderer;
  export const remote: Electron.Remote = require("electron").remote;
  const fs: ƒ.General = require("fs");

  // TODO: At this point of time, the project is just a single node. A project is much more complex...
  let node: ƒ.Node = null;


  window.addEventListener("load", initWindow);

  function initWindow(): void {
    ƒ.Debug.log("Fudge started");
    Editor.initialize();
    ƒ.Project.mode = ƒ.MODE.EDITOR;
    ƒ.Debug.log("Editor initialized");
    // TODO: create a new Panel containing a ViewData by default. More Views can be added by the user or by configuration

    ipcRenderer.on("save", (_event: Electron.IpcRendererEvent, _args: unknown[]) => {
      ƒ.Debug.log("Save");
      // panel = PanelManager.instance.getActivePanel();
      // if (panel instanceof PanelGraph) {
      //   node = panel.getNode();
      // }
      // save(node);
    });

    ipcRenderer.on("open", async (_event: Electron.IpcRendererEvent, _args: unknown[]) => {
      ƒ.Debug.log("Open");
      node = await open();
      Editor.broadcastEvent(new CustomEvent(EVENT_EDITOR.SET_GRAPH, { detail: node }));
    });

    ipcRenderer.on("openPanelGraph", (_event: Electron.IpcRendererEvent, _args: unknown[]) => {
      ƒ.Debug.log("openPanelGraph");
      openViewNode();
    });

    ipcRenderer.on("openPanelAnimation", (_event: Electron.IpcRendererEvent, _args: unknown[]) => {
      ƒ.Debug.log("openPanelAnimation");
      // openAnimationPanel();
    });

    // HACK!
    ipcRenderer.on("updateNode", (_event: Electron.IpcRendererEvent, _args: unknown[]) => {
      ƒ.Debug.log("updateNode");
    });
  }

  function openViewNode(): void {
    node = new ƒAid.NodeCoordinateSystem("WorldCooSys");
    let node2: ƒ.Node = new ƒAid.NodeCoordinateSystem("WorldCooSys", ƒ.Matrix4x4.IDENTITY());
    node.addChild(node2);
    node2.cmpTransform.local.translateZ(2);
    Editor.add(PanelGraph, "Graph", Object({ node: node })); //Object.create(null,  {node: { writable: true, value: node }}));
  }

  // function openAnimationPanel(): void {
  //   let panel: Panel = PanelManager.instance.createPanelFromTemplate(new ViewAnimationTemplate(), "Animation Panel");
  //   PanelManager.instance.addPanel(panel);
  // }

  function save(_node: ƒ.Node): void {
    let serialization: ƒ.Serialization = ƒ.Serializer.serialize(_node);
    let content: string = ƒ.Serializer.stringify(serialization);

    // You can obviously give a direct path without use the dialog (C:/Program Files/path/myfileexample.txt)
    let filename: string = remote.dialog.showSaveDialogSync(null, { title: "Save Graph", buttonLabel: "Save Graph", message: "ƒ-Message" });

    fs.writeFileSync(filename, content);
  }

  async function open(): Promise<ƒ.Node> {
    let filenames: string[] = remote.dialog.showOpenDialogSync(null, {
      title: "Load Project", buttonLabel: "Load Project", properties: ["openFile"],
      filters: [{ name: "HTML-File", extensions: ["html", "htm"] }]
    });

    console.log(filenames);
    let base: URL = new URL(filenames[0]);
    // let file: RequestInfo = "Test.json";

    let content: string = fs.readFileSync(base, { encoding: "utf-8" });
    ƒ.Debug.groupCollapsed("File content");
    ƒ.Debug.info(content);
    ƒ.Debug.groupEnd();

    const parser: DOMParser = new DOMParser();
    const dom: Document = parser.parseFromString(content, "application/xhtml+xml");
    const head: HTMLHeadElement = dom.getElementsByTagName("head")[0];
    console.log(head);

    const scripts: NodeListOf<HTMLScriptElement> = head.querySelectorAll("script");
    for (let script of scripts) {
      if (script.getAttribute("editor") == "true") {
        let url: string = script.getAttribute("src");
        await ƒ.Project.loadScript(new URL(url, base).toString());
      }
    }

    // support multiple resourcefiles
    const resourceFile: string = head.querySelector("link").getAttribute("src");
    ƒ.Project.baseURL = base;
    let reconstruction: ƒ.Resources = await ƒ.Project.loadResources(new URL(resourceFile, base).toString());

    ƒ.Debug.groupCollapsed("Deserialized");
    ƒ.Debug.info(reconstruction);
    ƒ.Debug.groupEnd();

    // TODO: this is a hack to get first NodeResource to display -> move all to project view
    for (let id in reconstruction) {
      if (id.startsWith("Node"))
        return <ƒ.NodeResource>reconstruction[id];
    }

    return null;
  }
}