///<reference path="../../UserInterface/Build/FudgeUserInterface.d.ts"/>
namespace Picking {
  import ƒ = FudgeCore;
  import ƒUi = FudgeUserInterface;
  import ƒAid = FudgeAid;

  window.addEventListener("load", start);
  let cmpCamera: ƒ.ComponentCamera;
  let viewport: ƒ.Viewport;
  let viewportPick: ƒ.Viewport = new ƒ.Viewport();
  let cameraPick: ƒ.ComponentCamera;

  let mouse: ƒ.Vector2 = new ƒ.Vector2();

  let cursor: ƒAid.Node = new ƒAid.Node(
    "Cursor",
    ƒ.Matrix4x4.SCALING(ƒ.Vector3.ONE(0.05)),
    new ƒ.Material("Cursor", ƒ.ShaderUniColor, new ƒ.CoatColored(ƒ.Color.CSS("darkgray"))),
    new ƒ.MeshSphere("Cursor", 5, 5)
  );

  class Data extends ƒ.Mutable {
    public red: number = 100;
    public green: number = 100;
    public blue: number = 100;
    public yellow: number = 100;
    public cursor: number = 100;
    protected reduceMutator(_mutator: ƒ.Mutator): void {/* */ }
  }
  let data: Data = new Data();
  let uiController: ƒUi.Controller;

  async function start(_event: Event): Promise<void> {
    ƒ.Debug.fudge("Start Picking");

    let domHud: HTMLDivElement = document.querySelector("div#ui");
    uiController = new ƒUi.Controller(data, domHud);

    await FudgeCore.Project.loadResourcesFromHTML();
    let canvas: HTMLCanvasElement = document.querySelector("canvas");
    canvas.addEventListener("mousemove", setCursorPosition);

    // pick the graph to show
    let graph: ƒ.Graph = <ƒ.Graph>await ƒ.Project.getResource("Graph|2021-02-03T16:20:47.935Z|07303");
    graph.appendChild(cursor);

    // setup the viewport
    cmpCamera = new ƒ.ComponentCamera();
    Reflect.set(cmpCamera, "far", 4.3);
    // Reflect.set(cmpCamera, "fieldOfView", 170);
    cmpCamera.pivot.translateZ(2.1);
    cmpCamera.pivot.rotateY(180);
    viewport = new ƒ.Viewport();
    viewport.initialize("Viewport", graph, cmpCamera, canvas);
    // FudgeAid.Viewport.expandCameraToInteractiveOrbit(viewport);
    viewport.draw();

    let canvasPick: HTMLCanvasElement = document.createElement("canvas");
    canvasPick.width = 10;
    canvasPick.height = 10;
    cameraPick = new ƒ.ComponentCamera();
    cameraPick.pivot.set(cmpCamera.pivot);
    cameraPick.projectCentral(1, 10);
    viewportPick.initialize("pick", graph, cameraPick, canvasPick);
    viewportPick.adjustingFrames = false;
    // viewportPick.adjustingCamera = false;

    viewport.createPickBuffers();
    ƒ.Loop.addEventListener(ƒ.EVENT.LOOP_FRAME, update);
    ƒ.Loop.start(ƒ.LOOP_MODE.TIME_GAME, 30);
    // canvas.addEventListener("mousemove", update);
    // window.addEventListener("resize", viewport.createPickBuffers.bind(viewport));

    function update(_event: Event): void {
      viewport.draw();
      // pickNodeAt(mouse);
      pick();
    }
  }

  function pick(): void {
    let posProjection: ƒ.Vector2 = viewport.pointClientToProjection(mouse);
    let ray: ƒ.Ray = new ƒ.Ray(new ƒ.Vector3(posProjection.x, posProjection.y, 1));
    // let ray: ƒ.Ray = viewport.getRayFromClient(mouse);
    cameraPick.pivot.lookAt(ray.direction);
    cameraPick.projectCentral(1, 0.001);

    let picks: ƒ.Pick[] = viewportPick.pick();
    // cursor.getComponent(ƒ.ComponentMaterial).activate(false);
    picks.sort((a: ƒ.Pick, b: ƒ.Pick) => (b.zBuffer > 0) ? (a.zBuffer > 0) ? a.zBuffer - b.zBuffer : 1 : -1);
    for (let hit of picks) {
      data[hit.node.name] = hit.zBuffer;
    }
    if (picks.length) {
      let pick: ƒ.Pick = picks[0];
      if (pick.node.name == "Cursor")
        pick = pick[1];
      cursor.mtxLocal.translation = viewport.calculateWorldFromZBuffer(mouse, pick.zBuffer);
    }
  }

  function pickNodeAt(_pos: ƒ.Vector2): void {
    let mouseUp: ƒ.Vector2 = new ƒ.Vector2(_pos.x, viewport.getClientRectangle().height - _pos.y);
    let posRender: ƒ.Vector2 = viewport.pointClientToRender(mouseUp);
    // cursor.mtxLocal.translation = ƒ.Vector3.ONE(100);

    let hits: ƒ.RayHit[] = viewport.pickNodeAt(posRender);
    hits.sort((a: ƒ.RayHit, b: ƒ.RayHit) => a.zBuffer < b.zBuffer ? -1 : 1);
    for (let hit of hits) {
      data[hit.node.name] = hit.zBuffer;
    }
    if (hits.length)
      cursor.mtxLocal.translation = viewport.calculateWorldFromZBuffer(mouse, hits[0].zBuffer);
  }


  function setCursorPosition(_event: MouseEvent): void {
    mouse = new ƒ.Vector2(_event.clientX, _event.clientY);
  }

}