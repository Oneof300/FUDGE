///<reference types="../../Core/Build/FudgeCore"/>
///<reference types="../../Aid/Build/FudgeAid"/>

namespace ParticleSystemTest {
  import f = FudgeCore;
  import fAid = FudgeAid;

  window.addEventListener("load", hndLoad);

  let root: f.Node = new f.Node("Root");
  let viewport: f.Viewport;
  let camera: fAid.CameraOrbit;
  let speedCameraRotation: number = 0.2;
  let speedCameraTranslation: number = 0.02;

  let input: HTMLInputElement;

  let particleSystem: f.ComponentParticleSystem;

  function hndLoad(_event: Event): void {
    f.RenderManager.initialize(true, false);
    f.RenderManager.setDepthTest(false);
    f.RenderManager.setBlendMode(f.BLEND.PARTICLE);

    input = <HTMLInputElement>document.getElementById("particleNum");
    const canvas: HTMLCanvasElement = document.querySelector("canvas");
    f.Debug.log("Canvas", canvas);
    f.Debug.setFilter(f.DebugConsole, f.DEBUG_FILTER.ERROR);

    // enable unlimited mouse-movement (user needs to click on canvas first)
    canvas.addEventListener("mousedown", canvas.requestPointerLock);
    canvas.addEventListener("mouseup", () => document.exitPointerLock());

    // set lights
    let cmpLight: f.ComponentLight = new f.ComponentLight(new f.LightDirectional(f.Color.CSS("WHITE")));
    cmpLight.pivot.lookAt(new f.Vector3(0.5, -1, -0.8));
    // game.addComponent(cmpLight);
    let cmpLightAmbient: f.ComponentLight = new f.ComponentLight(new f.LightAmbient(new f.Color(0.25, 0.25, 0.25, 1)));
    root.addComponent(cmpLightAmbient);

    // setup orbiting camera
    camera = new fAid.CameraOrbit(new f.ComponentCamera(), 4);
    camera.component.backgroundColor = f.Color.CSS("black");
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
    let img: HTMLImageElement = document.querySelector("img");
    let txtImage: f.TextureImage = new f.TextureImage();
    txtImage.image = img;
    let coat: f.CoatTextured = new f.CoatTextured();
    coat.texture = txtImage;

    let material: f.Material = new f.Material("Material", f.ShaderTexture, coat);
    // let material: ƒ.Material = new ƒ.Material("Material", ƒ.ShaderUniColor, new ƒ.CoatColored(ƒ.Color.CSS("WHITE")));
    let mesh: f.Mesh = new f.MeshQuad();

    particleSystem = new f.ComponentParticleSystem("data.json", input.valueAsNumber);
    root.addComponent(particleSystem);
    particleSystem.createParticles(mesh, material);

    // let backgroundMaterial: ƒ.Material = new ƒ.Material("Material", ƒ.ShaderUniColor, new ƒ.CoatColored(ƒ.Color.CSS("SKYBLUE")));
    // let background: ƒ.Node = new ƒAid.Node("Backgound", ƒ.Matrix4x4.TRANSLATION(ƒ.Vector3.Z(-1)), backgroundMaterial, mesh);
    // root.addChild(background);
    // root.addChild(new ƒAid.Node("Backgound", ƒ.Matrix4x4.TRANSLATION(ƒ.Vector3.Z(1)), backgroundMaterial, mesh));

    // setup input
    input.addEventListener("input", (_event: Event) => {
      let newParticleSystem: f.ComponentParticleSystem = new f.ComponentParticleSystem("data.json", input.valueAsNumber);
      root.removeComponent(particleSystem);
      root.addComponent(newParticleSystem);
      newParticleSystem.createParticles(mesh, material);
      particleSystem = newParticleSystem;
    });

    input.dispatchEvent(new Event("input"));

    f.Loop.addEventListener(f.EVENT.LOOP_FRAME, update);
    f.Loop.start(f.LOOP_MODE.TIME_GAME, 30);

    function update(_event: f.Eventƒ): void {
      let time: number = f.Time.game.get() / 1000;
      particleSystem.updateParticleEffect(time);
      viewport.draw();
    }

  }

  function hndPointerMove(_event: PointerEvent): void {
    if (!_event.buttons)
      return;
    camera.rotateY(_event.movementX * speedCameraRotation);
    camera.rotateX(_event.movementY * speedCameraRotation);
  }

  function hndWheelMove(_event: WheelEvent): void {
    camera.distance = camera.distance + _event.deltaY * speedCameraTranslation;
  }
}