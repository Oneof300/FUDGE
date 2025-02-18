///<reference types="../../../../Core/Build/FudgeCore"/>
///<reference types="../../../../Aid/Build/FudgeAid"/>

namespace fromJSON {
  import f = FudgeCore;
  import fAid = FudgeAid;

  window.addEventListener("load", hndLoad);

  let root: f.Node = new f.Node("Root");
  let viewport: f.Viewport;
  let camera: fAid.CameraOrbit;
  let speedCameraRotation: number = 0.2;
  let speedCameraTranslation: number = 0.02;

  let input: HTMLInputElement;

  let particleSystem: ParticleSystem;

  function hndLoad(_event: Event): void {
    input = <HTMLInputElement>document.getElementById("particleNum");
    const canvas: HTMLCanvasElement = document.querySelector("canvas");
    f.RenderManager.initialize(false, true);
    f.Debug.log("Canvas", canvas);

    // enable unlimited mouse-movement (user needs to click on canvas first)
    canvas.addEventListener("mousedown", canvas.requestPointerLock);
    canvas.addEventListener("mouseup", () => document.exitPointerLock());

    // setup orbiting camera
    camera = new fAid.CameraOrbit(new f.ComponentCamera(), 4);
    root.addChild(camera);

    // setup coordinate axes
    let coordinateSystem: fAid.NodeCoordinateSystem = new fAid.NodeCoordinateSystem("Coordinates", f.Matrix4x4.SCALING(new f.Vector3(1, 1, 1)));
    root.addChild(coordinateSystem);

    // setup viewport
    viewport = new f.Viewport();
    viewport.initialize("Viewport", root, camera.component, canvas);
    f.Debug.log("Viewport", viewport);

    // setup event handling
    viewport.activatePointerEvent(f.EVENT_POINTER.MOVE, true);
    viewport.activateWheelEvent(f.EVENT_WHEEL.WHEEL, true);
    viewport.addEventListener(f.EVENT_POINTER.MOVE, hndPointerMove);
    viewport.addEventListener(f.EVENT_WHEEL.WHEEL, hndWheelMove);

    // setup particles
    let mesh: f.Mesh = new f.MeshCube();
    let material: f.Material = new f.Material("Alpha", f.ShaderUniColor, new f.CoatColored(f.Color.CSS("YELLOW")));
    root.addChild(new f.Node("Particles"));

    // setup input
    input.addEventListener("input", (_event: Event) => {
      let newParticleSystem: ParticleSystem = new ParticleSystem(mesh, material, f.Matrix4x4.TRANSLATION(f.Vector3.Y(-.5)), input.valueAsNumber, 0.5, -2, -1, 0.5, 0.5, 0, 1);
      root.replaceChild(getParticleSystem(), newParticleSystem);
      particleSystem = getParticleSystem();
    });

    input.dispatchEvent(new Event("input"));

    f.Loop.addEventListener(f.EVENT.LOOP_FRAME, update);
    f.Loop.start(f.LOOP_MODE.TIME_GAME, 60);

    function update(_event: f.Eventƒ): void {
      let time: number = f.Time.game.get() / 1000;
      particleSystem.update(time);
      viewport.draw();
    }

  }

  function getParticleSystem(): ParticleSystem {
    return <ParticleSystem>root.getChildrenByName("Particles")[0];
  }

  function hndPointerMove(_event: f.EventPointer): void {
    if (!_event.buttons)
      return;
    camera.rotateY(_event.movementX * speedCameraRotation);
    camera.rotateX(_event.movementY * speedCameraRotation);
  }

  function hndWheelMove(_event: WheelEvent): void {
    camera.distance = camera.distance + _event.deltaY * speedCameraTranslation;
  }
}