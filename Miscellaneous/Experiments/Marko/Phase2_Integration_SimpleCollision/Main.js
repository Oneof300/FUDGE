"use strict";
///<reference types="../../../../Core/Build/FudgeCore.js"/>
var f = FudgeCore;
var FudgePhysics_Communication;
(function (FudgePhysics_Communication) {
    window.addEventListener("load", init);
    const app = document.querySelector("canvas");
    let viewPort;
    let hierarchy;
    let fps;
    const times = [];
    let fpsDisplay = document.querySelector("h2#FPS");
    let bodies = new Array();
    let origin = new f.Vector3(-5, 0.25, 0);
    let direction = new f.Vector3(1, 0, 0);
    let hitInfo = new f.RayHitInfo();
    let ground;
    let stepWidth = 0.1;
    let moveableTransform;
    function init(_event) {
        f.Debug.log(app);
        //f.RenderManager.initialize();
        //f.Physics.initializePhysics();
        hierarchy = new f.Node("Scene");
        document.addEventListener("keypress", hndKey);
        ground = createCompleteMeshNode("Ground", new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(0.2, 0.2, 0.2, 1))), new f.MeshCube(), 0, f.PHYSICS_TYPE.STATIC, f.PHYSICS_GROUP.GROUP_1);
        let cmpGroundMesh = ground.getComponent(f.ComponentTransform);
        cmpGroundMesh.local.scale(new f.Vector3(10, 0.3, 10));
        cmpGroundMesh.local.translate(new f.Vector3(0, -1.5, 0));
        hierarchy.appendChild(ground);
        bodies[0] = createCompleteMeshNode("Cube_1", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.DYNAMIC, f.PHYSICS_GROUP.GROUP_2);
        let cmpCubeTransform = bodies[0].getComponent(f.ComponentTransform);
        hierarchy.appendChild(bodies[0]);
        cmpCubeTransform.local.translate(new f.Vector3(0, 7, 0));
        bodies[1] = createCompleteMeshNode("Cube_2", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 1, 0, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.DYNAMIC, f.PHYSICS_GROUP.GROUP_1);
        let cmpCubeTransform2 = bodies[1].getComponent(f.ComponentTransform);
        bodies[0].appendChild(bodies[1]);
        bodies[1].removeComponent(bodies[1].getComponent(f.ComponentRigidbody));
        cmpCubeTransform2.local.translate(new f.Vector3(0, 1, 0));
        bodies[2] = createCompleteMeshNode("Cube_3", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.DYNAMIC);
        let cmpCubeTransform3 = bodies[2].getComponent(f.ComponentTransform);
        hierarchy.appendChild(bodies[2]);
        cmpCubeTransform3.local.translate(new f.Vector3(0.5, 3, 0.5));
        bodies[3] = createCompleteMeshNode("Cube_3", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(0, 0, 1, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.KINEMATIC);
        moveableTransform = bodies[3].getComponent(f.ComponentTransform);
        hierarchy.appendChild(bodies[3]);
        moveableTransform.local.translate(new f.Vector3(-4, 1, 0));
        bodies[4] = createCompleteMeshNode("Pyramid", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(0, 0, 1, 1))), new f.MeshPyramid, 1, f.PHYSICS_TYPE.DYNAMIC, f.PHYSICS_GROUP.GROUP_1, f.COLLIDER_TYPE.PYRAMID);
        hierarchy.appendChild(bodies[4]);
        bodies[4].mtxLocal.translate(new f.Vector3(0, 4, 3));
        bodies[4].mtxLocal.scale(new f.Vector3(1.5, 1.5, 1.5));
        bodies[4].mtxLocal.rotateY(120, false);
        let cmpLight = new f.ComponentLight(new f.LightDirectional(f.Color.CSS("WHITE")));
        cmpLight.pivot.lookAt(new f.Vector3(0.5, -1, -0.8));
        hierarchy.addComponent(cmpLight);
        let cmpCamera = new f.ComponentCamera();
        cmpCamera.backgroundColor = f.Color.CSS("GREY");
        cmpCamera.pivot.translate(new f.Vector3(2, 2, 10));
        cmpCamera.pivot.lookAt(f.Vector3.ZERO());
        viewPort = new f.Viewport();
        viewPort.initialize("Viewport", hierarchy, cmpCamera, app);
        viewPort.showSceneGraph();
        f.Loop.addEventListener("loopFrame" /* LOOP_FRAME */, update);
        f.Physics.start(hierarchy);
        f.Loop.start();
    }
    function update() {
        f.Physics.world.simulate();
        hitInfo = f.Physics.raycast(origin, direction, 10);
        if (hitInfo.hit == true && hitInfo.rigidbodyComponent.getContainer().name == "Cube_1") {
            f.Debug.log(hitInfo);
        }
        viewPort.draw();
        measureFPS();
    }
    function measureFPS() {
        window.requestAnimationFrame(() => {
            const now = performance.now();
            while (times.length > 0 && times[0] <= now - 1000) {
                times.shift();
            }
            times.push(now);
            fps = times.length;
            fpsDisplay.textContent = "FPS: " + fps.toString();
        });
    }
    function createCompleteMeshNode(_name, _material, _mesh, _mass, _physicsType, _group = f.PHYSICS_GROUP.DEFAULT, _colType = f.COLLIDER_TYPE.CUBE) {
        let node = new f.Node(_name);
        let cmpMesh = new f.ComponentMesh(_mesh);
        let cmpMaterial = new f.ComponentMaterial(_material);
        let cmpTransform = new f.ComponentTransform();
        let cmpRigidbody = new f.ComponentRigidbody(_mass, _physicsType, _colType, _group);
        cmpRigidbody.setRestitution(0.2);
        cmpRigidbody.setFriction(0.8);
        node.addComponent(cmpMesh);
        node.addComponent(cmpMaterial);
        node.addComponent(cmpTransform);
        node.addComponent(cmpRigidbody);
        //f.Debug.log(cmpRigidbody.collisionGroup);
        //f.Debug.log("Mask" + cmpRigidbody.getOimoRigidbody().getShapeList().getCollisionMask());
        return node;
    }
    function hndKey(_event) {
        let horizontal = 0;
        let vertical = 0;
        let height = 0;
        if (_event.code == f.KEYBOARD_CODE.A) {
            horizontal -= 1 * stepWidth;
        }
        if (_event.code == f.KEYBOARD_CODE.D) {
            horizontal += 1 * stepWidth;
        }
        if (_event.code == f.KEYBOARD_CODE.W) {
            vertical -= 1 * stepWidth;
        }
        if (_event.code == f.KEYBOARD_CODE.S) {
            vertical += 1 * stepWidth;
        }
        if (_event.code == f.KEYBOARD_CODE.Q) {
            height += 1 * stepWidth;
        }
        if (_event.code == f.KEYBOARD_CODE.E) {
            height -= 1 * stepWidth;
        }
        let pos = moveableTransform.local.translation;
        pos.add(new f.Vector3(horizontal, height, vertical));
        moveableTransform.local.translation = pos;
    }
})(FudgePhysics_Communication || (FudgePhysics_Communication = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIk1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLDJEQUEyRDtBQUMzRCxJQUFPLENBQUMsR0FBRyxTQUFTLENBQUM7QUFJckIsSUFBVSwwQkFBMEIsQ0E0Sm5DO0FBNUpELFdBQVUsMEJBQTBCO0lBRWxDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDdEMsTUFBTSxHQUFHLEdBQXNCLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDaEUsSUFBSSxRQUFvQixDQUFDO0lBQ3pCLElBQUksU0FBaUIsQ0FBQztJQUN0QixJQUFJLEdBQVcsQ0FBQztJQUNoQixNQUFNLEtBQUssR0FBYSxFQUFFLENBQUM7SUFDM0IsSUFBSSxVQUFVLEdBQWdCLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFL0QsSUFBSSxNQUFNLEdBQWEsSUFBSSxLQUFLLEVBQUUsQ0FBQztJQUNuQyxJQUFJLE1BQU0sR0FBYyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ25ELElBQUksU0FBUyxHQUFjLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2xELElBQUksT0FBTyxHQUFpQixJQUFJLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUMvQyxJQUFJLE1BQWMsQ0FBQztJQUVuQixJQUFJLFNBQVMsR0FBVyxHQUFHLENBQUM7SUFFNUIsSUFBSSxpQkFBdUMsQ0FBQztJQUk1QyxTQUFTLElBQUksQ0FBQyxNQUFhO1FBQ3pCLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pCLCtCQUErQjtRQUMvQixnQ0FBZ0M7UUFDaEMsU0FBUyxHQUFHLElBQUks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QyxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUU7WUFDcEMsVUFBVSxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUM7U0FDN0I7UUFDRCxJQUFJLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUU7WUFDcEMsVUFBVSxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUM7U0FDN0I7UUFDRCxJQUFJLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUU7WUFDcEMsUUFBUSxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUM7U0FDM0I7UUFDRCxJQUFJLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUU7WUFDcEMsUUFBUSxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUM7U0FDM0I7UUFDRCxJQUFJLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUU7WUFDcEMsTUFBTSxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUM7U0FDekI7UUFDRCxJQUFJLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUU7WUFDcEMsTUFBTSxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUM7U0FDekI7UUFDRCxJQUFJLEdBQUcsR0FBYyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDO1FBQ3pELEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUNyRCxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLEdBQUcsQ0FBQztJQUM1QyxDQUFDO0FBRUgsQ0FBQyxFQTVKUywwQkFBMEIsS0FBMUIsMEJBQTBCLFFBNEpuQyIsInNvdXJjZXNDb250ZW50IjpbIi8vLzxyZWZlcmVuY2UgdHlwZXM9XCIuLi8uLi8uLi8uLi9Db3JlL0J1aWxkL0Z1ZGdlQ29yZS5qc1wiLz5cclxuaW1wb3J0IGYgPSBGdWRnZUNvcmU7XHJcblxyXG5cclxuXHJcbm5hbWVzcGFjZSBGdWRnZVBoeXNpY3NfQ29tbXVuaWNhdGlvbiB7XHJcblxyXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCBpbml0KTtcclxuICBjb25zdCBhcHA6IEhUTUxDYW52YXNFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImNhbnZhc1wiKTtcclxuICBsZXQgdmlld1BvcnQ6IGYuVmlld3BvcnQ7XHJcbiAgbGV0IGhpZXJhcmNoeTogZi5Ob2RlO1xyXG4gIGxldCBmcHM6IG51bWJlcjtcclxuICBjb25zdCB0aW1lczogbnVtYmVyW10gPSBbXTtcclxuICBsZXQgZnBzRGlzcGxheTogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiaDIjRlBTXCIpO1xyXG5cclxuICBsZXQgYm9kaWVzOiBmLk5vZGVbXSA9IG5ldyBBcnJheSgpO1xyXG4gIGxldCBvcmlnaW46IGYuVmVjdG9yMyA9IG5ldyBmLlZlY3RvcjMoLTUsIDAuMjUsIDApO1xyXG4gIGxldCBkaXJlY3Rpb246IGYuVmVjdG9yMyA9IG5ldyBmLlZlY3RvcjMoMSwgMCwgMCk7XHJcbiAgbGV0IGhpdEluZm86IGYuUmF5SGl0SW5mbyA9IG5ldyBmLlJheUhpdEluZm8oKTtcclxuICBsZXQgZ3JvdW5kOiBmLk5vZGU7XHJcblxyXG4gIGxldCBzdGVwV2lkdGg6IG51bWJlciA9IDAuMTtcclxuXHJcbiAgbGV0IG1vdmVhYmxlVHJhbnNmb3JtOiBmLkNvbXBvbmVudFRyYW5zZm9ybTtcclxuXHJcblxyXG5cclxuICBmdW5jdGlvbiBpbml0KF9ldmVudDogRXZlbnQpOiB2b2lkIHtcclxuICAgIGYuRGVidWcubG9nKGFwcCk7XHJcbiAgICAvL2YuUmVuZGVyTWFuYWdlci5pbml0aWFsaXplKCk7XHJcbiAgICAvL2YuUGh5c2ljcy5pbml0aWFsaXplUGh5c2ljcygpO1xyXG4gICAgaGllcmFyY2h5ID0gbmV3IGYuTm9kZShcIlNjZW5lXCIpO1xyXG5cclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlwcmVzc1wiLCBobmRLZXkpO1xyXG5cclxuICAgIGdyb3VuZCA9IGNyZWF0ZUNvbXBsZXRlTWVzaE5vZGUoXCJHcm91bmRcIiwgbmV3IGYuTWF0ZXJpYWwoXCJHcm91bmRcIiwgZi5TaGFkZXJGbGF0LCBuZXcgZi5Db2F0Q29sb3JlZChuZXcgZi5Db2xvcigwLjIsIDAuMiwgMC4yLCAxKSkpLCBuZXcgZi5NZXNoQ3ViZSgpLCAwLCBmLlBIWVNJQ1NfVFlQRS5TVEFUSUMsIGYuUEhZU0lDU19HUk9VUC5HUk9VUF8xKTtcclxuICAgIGxldCBjbXBHcm91bmRNZXNoOiBmLkNvbXBvbmVudFRyYW5zZm9ybSA9IGdyb3VuZC5nZXRDb21wb25lbnQoZi5Db21wb25lbnRUcmFuc2Zvcm0pO1xyXG4gICAgY21wR3JvdW5kTWVzaC5sb2NhbC5zY2FsZShuZXcgZi5WZWN0b3IzKDEwLCAwLjMsIDEwKSk7XHJcblxyXG4gICAgY21wR3JvdW5kTWVzaC5sb2NhbC50cmFuc2xhdGUobmV3IGYuVmVjdG9yMygwLCAtMS41LCAwKSk7XHJcbiAgICBoaWVyYXJjaHkuYXBwZW5kQ2hpbGQoZ3JvdW5kKTtcclxuXHJcbiAgICBib2RpZXNbMF0gPSBjcmVhdGVDb21wbGV0ZU1lc2hOb2RlKFwiQ3ViZV8xXCIsIG5ldyBmLk1hdGVyaWFsKFwiQ3ViZVwiLCBmLlNoYWRlckZsYXQsIG5ldyBmLkNvYXRDb2xvcmVkKG5ldyBmLkNvbG9yKDEsIDAsIDAsIDEpKSksIG5ldyBmLk1lc2hDdWJlKCksIDEsIGYuUEhZU0lDU19UWVBFLkRZTkFNSUMsIGYuUEhZU0lDU19HUk9VUC5HUk9VUF8yKTtcclxuICAgIGxldCBjbXBDdWJlVHJhbnNmb3JtOiBmLkNvbXBvbmVudFRyYW5zZm9ybSA9IGJvZGllc1swXS5nZXRDb21wb25lbnQoZi5Db21wb25lbnRUcmFuc2Zvcm0pO1xyXG4gICAgaGllcmFyY2h5LmFwcGVuZENoaWxkKGJvZGllc1swXSk7XHJcbiAgICBjbXBDdWJlVHJhbnNmb3JtLmxvY2FsLnRyYW5zbGF0ZShuZXcgZi5WZWN0b3IzKDAsIDcsIDApKTtcclxuXHJcbiAgICBib2RpZXNbMV0gPSBjcmVhdGVDb21wbGV0ZU1lc2hOb2RlKFwiQ3ViZV8yXCIsIG5ldyBmLk1hdGVyaWFsKFwiQ3ViZVwiLCBmLlNoYWRlckZsYXQsIG5ldyBmLkNvYXRDb2xvcmVkKG5ldyBmLkNvbG9yKDEsIDEsIDAsIDEpKSksIG5ldyBmLk1lc2hDdWJlKCksIDEsIGYuUEhZU0lDU19UWVBFLkRZTkFNSUMsIGYuUEhZU0lDU19HUk9VUC5HUk9VUF8xKTtcclxuICAgIGxldCBjbXBDdWJlVHJhbnNmb3JtMjogZi5Db21wb25lbnRUcmFuc2Zvcm0gPSBib2RpZXNbMV0uZ2V0Q29tcG9uZW50KGYuQ29tcG9uZW50VHJhbnNmb3JtKTtcclxuICAgIGJvZGllc1swXS5hcHBlbmRDaGlsZChib2RpZXNbMV0pO1xyXG4gICAgYm9kaWVzWzFdLnJlbW92ZUNvbXBvbmVudChib2RpZXNbMV0uZ2V0Q29tcG9uZW50KGYuQ29tcG9uZW50UmlnaWRib2R5KSk7XHJcbiAgICBjbXBDdWJlVHJhbnNmb3JtMi5sb2NhbC50cmFuc2xhdGUobmV3IGYuVmVjdG9yMygwLCAxLCAwKSk7XHJcblxyXG4gICAgYm9kaWVzWzJdID0gY3JlYXRlQ29tcGxldGVNZXNoTm9kZShcIkN1YmVfM1wiLCBuZXcgZi5NYXRlcmlhbChcIkN1YmVcIiwgZi5TaGFkZXJGbGF0LCBuZXcgZi5Db2F0Q29sb3JlZChuZXcgZi5Db2xvcigxLCAwLCAwLCAxKSkpLCBuZXcgZi5NZXNoQ3ViZSgpLCAxLCBmLlBIWVNJQ1NfVFlQRS5EWU5BTUlDKTtcclxuICAgIGxldCBjbXBDdWJlVHJhbnNmb3JtMzogZi5Db21wb25lbnRUcmFuc2Zvcm0gPSBib2RpZXNbMl0uZ2V0Q29tcG9uZW50KGYuQ29tcG9uZW50VHJhbnNmb3JtKTtcclxuICAgIGhpZXJhcmNoeS5hcHBlbmRDaGlsZChib2RpZXNbMl0pO1xyXG4gICAgY21wQ3ViZVRyYW5zZm9ybTMubG9jYWwudHJhbnNsYXRlKG5ldyBmLlZlY3RvcjMoMC41LCAzLCAwLjUpKTtcclxuXHJcbiAgICBib2RpZXNbM10gPSBjcmVhdGVDb21wbGV0ZU1lc2hOb2RlKFwiQ3ViZV8zXCIsIG5ldyBmLk1hdGVyaWFsKFwiQ3ViZVwiLCBmLlNoYWRlckZsYXQsIG5ldyBmLkNvYXRDb2xvcmVkKG5ldyBmLkNvbG9yKDAsIDAsIDEsIDEpKSksIG5ldyBmLk1lc2hDdWJlKCksIDEsIGYuUEhZU0lDU19UWVBFLktJTkVNQVRJQyk7XHJcbiAgICBtb3ZlYWJsZVRyYW5zZm9ybSA9IGJvZGllc1szXS5nZXRDb21wb25lbnQoZi5Db21wb25lbnRUcmFuc2Zvcm0pO1xyXG4gICAgaGllcmFyY2h5LmFwcGVuZENoaWxkKGJvZGllc1szXSk7XHJcbiAgICBtb3ZlYWJsZVRyYW5zZm9ybS5sb2NhbC50cmFuc2xhdGUobmV3IGYuVmVjdG9yMygtNCwgMSwgMCkpO1xyXG5cclxuICAgIGJvZGllc1s0XSA9IGNyZWF0ZUNvbXBsZXRlTWVzaE5vZGUoXCJQeXJhbWlkXCIsIG5ldyBmLk1hdGVyaWFsKFwiQ3ViZVwiLCBmLlNoYWRlckZsYXQsIG5ldyBmLkNvYXRDb2xvcmVkKG5ldyBmLkNvbG9yKDAsIDAsIDEsIDEpKSksIG5ldyBmLk1lc2hQeXJhbWlkLCAxLCBmLlBIWVNJQ1NfVFlQRS5EWU5BTUlDLCBmLlBIWVNJQ1NfR1JPVVAuR1JPVVBfMSwgZi5DT0xMSURFUl9UWVBFLlBZUkFNSUQpO1xyXG4gICAgaGllcmFyY2h5LmFwcGVuZENoaWxkKGJvZGllc1s0XSk7XHJcbiAgICBib2RpZXNbNF0ubXR4TG9jYWwudHJhbnNsYXRlKG5ldyBmLlZlY3RvcjMoMCwgNCwgMykpO1xyXG4gICAgYm9kaWVzWzRdLm10eExvY2FsLnNjYWxlKG5ldyBmLlZlY3RvcjMoMS41LCAxLjUsIDEuNSkpO1xyXG4gICAgYm9kaWVzWzRdLm10eExvY2FsLnJvdGF0ZVkoMTIwLCBmYWxzZSk7XHJcblxyXG5cclxuICAgIGxldCBjbXBMaWdodDogZi5Db21wb25lbnRMaWdodCA9IG5ldyBmLkNvbXBvbmVudExpZ2h0KG5ldyBmLkxpZ2h0RGlyZWN0aW9uYWwoZi5Db2xvci5DU1MoXCJXSElURVwiKSkpO1xyXG4gICAgY21wTGlnaHQucGl2b3QubG9va0F0KG5ldyBmLlZlY3RvcjMoMC41LCAtMSwgLTAuOCkpO1xyXG4gICAgaGllcmFyY2h5LmFkZENvbXBvbmVudChjbXBMaWdodCk7XHJcblxyXG4gICAgbGV0IGNtcENhbWVyYTogZi5Db21wb25lbnRDYW1lcmEgPSBuZXcgZi5Db21wb25lbnRDYW1lcmEoKTtcclxuICAgIGNtcENhbWVyYS5iYWNrZ3JvdW5kQ29sb3IgPSBmLkNvbG9yLkNTUyhcIkdSRVlcIik7XHJcbiAgICBjbXBDYW1lcmEucGl2b3QudHJhbnNsYXRlKG5ldyBmLlZlY3RvcjMoMiwgMiwgMTApKTtcclxuICAgIGNtcENhbWVyYS5waXZvdC5sb29rQXQoZi5WZWN0b3IzLlpFUk8oKSk7XHJcblxyXG5cclxuICAgIHZpZXdQb3J0ID0gbmV3IGYuVmlld3BvcnQoKTtcclxuICAgIHZpZXdQb3J0LmluaXRpYWxpemUoXCJWaWV3cG9ydFwiLCBoaWVyYXJjaHksIGNtcENhbWVyYSwgYXBwKTtcclxuXHJcbiAgICB2aWV3UG9ydC5zaG93U2NlbmVHcmFwaCgpO1xyXG4gICAgZi5Mb29wLmFkZEV2ZW50TGlzdGVuZXIoZi5FVkVOVC5MT09QX0ZSQU1FLCB1cGRhdGUpO1xyXG4gICAgZi5QaHlzaWNzLnN0YXJ0KGhpZXJhcmNoeSk7XHJcbiAgICBmLkxvb3Auc3RhcnQoKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHVwZGF0ZSgpOiB2b2lkIHtcclxuICAgIGYuUGh5c2ljcy53b3JsZC5zaW11bGF0ZSgpO1xyXG4gICAgaGl0SW5mbyA9IGYuUGh5c2ljcy5yYXljYXN0KG9yaWdpbiwgZGlyZWN0aW9uLCAxMCk7XHJcbiAgICBpZiAoaGl0SW5mby5oaXQgPT0gdHJ1ZSAmJiBoaXRJbmZvLnJpZ2lkYm9keUNvbXBvbmVudC5nZXRDb250YWluZXIoKS5uYW1lID09IFwiQ3ViZV8xXCIpIHtcclxuICAgICAgZi5EZWJ1Zy5sb2coaGl0SW5mbyk7XHJcbiAgICB9XHJcblxyXG4gICAgdmlld1BvcnQuZHJhdygpO1xyXG4gICAgbWVhc3VyZUZQUygpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gbWVhc3VyZUZQUygpOiB2b2lkIHtcclxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xyXG4gICAgICBjb25zdCBub3c6IG51bWJlciA9IHBlcmZvcm1hbmNlLm5vdygpO1xyXG4gICAgICB3aGlsZSAodGltZXMubGVuZ3RoID4gMCAmJiB0aW1lc1swXSA8PSBub3cgLSAxMDAwKSB7XHJcbiAgICAgICAgdGltZXMuc2hpZnQoKTtcclxuICAgICAgfVxyXG4gICAgICB0aW1lcy5wdXNoKG5vdyk7XHJcbiAgICAgIGZwcyA9IHRpbWVzLmxlbmd0aDtcclxuICAgICAgZnBzRGlzcGxheS50ZXh0Q29udGVudCA9IFwiRlBTOiBcIiArIGZwcy50b1N0cmluZygpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBjcmVhdGVDb21wbGV0ZU1lc2hOb2RlKF9uYW1lOiBzdHJpbmcsIF9tYXRlcmlhbDogZi5NYXRlcmlhbCwgX21lc2g6IGYuTWVzaCwgX21hc3M6IG51bWJlciwgX3BoeXNpY3NUeXBlOiBmLlBIWVNJQ1NfVFlQRSwgX2dyb3VwOiBmLlBIWVNJQ1NfR1JPVVAgPSBmLlBIWVNJQ1NfR1JPVVAuREVGQVVMVCwgX2NvbFR5cGU6IGYuQ09MTElERVJfVFlQRSA9IGYuQ09MTElERVJfVFlQRS5DVUJFKTogZi5Ob2RlIHtcclxuICAgIGxldCBub2RlOiBmLk5vZGUgPSBuZXcgZi5Ob2RlKF9uYW1lKTtcclxuICAgIGxldCBjbXBNZXNoOiBmLkNvbXBvbmVudE1lc2ggPSBuZXcgZi5Db21wb25lbnRNZXNoKF9tZXNoKTtcclxuICAgIGxldCBjbXBNYXRlcmlhbDogZi5Db21wb25lbnRNYXRlcmlhbCA9IG5ldyBmLkNvbXBvbmVudE1hdGVyaWFsKF9tYXRlcmlhbCk7XHJcblxyXG4gICAgbGV0IGNtcFRyYW5zZm9ybTogZi5Db21wb25lbnRUcmFuc2Zvcm0gPSBuZXcgZi5Db21wb25lbnRUcmFuc2Zvcm0oKTtcclxuXHJcblxyXG4gICAgbGV0IGNtcFJpZ2lkYm9keTogZi5Db21wb25lbnRSaWdpZGJvZHkgPSBuZXcgZi5Db21wb25lbnRSaWdpZGJvZHkoX21hc3MsIF9waHlzaWNzVHlwZSwgX2NvbFR5cGUsIF9ncm91cCk7XHJcbiAgICBjbXBSaWdpZGJvZHkuc2V0UmVzdGl0dXRpb24oMC4yKTtcclxuICAgIGNtcFJpZ2lkYm9keS5zZXRGcmljdGlvbigwLjgpO1xyXG4gICAgbm9kZS5hZGRDb21wb25lbnQoY21wTWVzaCk7XHJcbiAgICBub2RlLmFkZENvbXBvbmVudChjbXBNYXRlcmlhbCk7XHJcbiAgICBub2RlLmFkZENvbXBvbmVudChjbXBUcmFuc2Zvcm0pO1xyXG4gICAgbm9kZS5hZGRDb21wb25lbnQoY21wUmlnaWRib2R5KTtcclxuICAgIC8vZi5EZWJ1Zy5sb2coY21wUmlnaWRib2R5LmNvbGxpc2lvbkdyb3VwKTtcclxuICAgIC8vZi5EZWJ1Zy5sb2coXCJNYXNrXCIgKyBjbXBSaWdpZGJvZHkuZ2V0T2ltb1JpZ2lkYm9keSgpLmdldFNoYXBlTGlzdCgpLmdldENvbGxpc2lvbk1hc2soKSk7XHJcblxyXG4gICAgcmV0dXJuIG5vZGU7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBobmRLZXkoX2V2ZW50OiBLZXlib2FyZEV2ZW50KTogdm9pZCB7XHJcbiAgICBsZXQgaG9yaXpvbnRhbDogbnVtYmVyID0gMDtcclxuICAgIGxldCB2ZXJ0aWNhbDogbnVtYmVyID0gMDtcclxuICAgIGxldCBoZWlnaHQ6IG51bWJlciA9IDA7XHJcblxyXG4gICAgaWYgKF9ldmVudC5jb2RlID09IGYuS0VZQk9BUkRfQ09ERS5BKSB7XHJcbiAgICAgIGhvcml6b250YWwgLT0gMSAqIHN0ZXBXaWR0aDtcclxuICAgIH1cclxuICAgIGlmIChfZXZlbnQuY29kZSA9PSBmLktFWUJPQVJEX0NPREUuRCkge1xyXG4gICAgICBob3Jpem9udGFsICs9IDEgKiBzdGVwV2lkdGg7XHJcbiAgICB9XHJcbiAgICBpZiAoX2V2ZW50LmNvZGUgPT0gZi5LRVlCT0FSRF9DT0RFLlcpIHtcclxuICAgICAgdmVydGljYWwgLT0gMSAqIHN0ZXBXaWR0aDtcclxuICAgIH1cclxuICAgIGlmIChfZXZlbnQuY29kZSA9PSBmLktFWUJPQVJEX0NPREUuUykge1xyXG4gICAgICB2ZXJ0aWNhbCArPSAxICogc3RlcFdpZHRoO1xyXG4gICAgfVxyXG4gICAgaWYgKF9ldmVudC5jb2RlID09IGYuS0VZQk9BUkRfQ09ERS5RKSB7XHJcbiAgICAgIGhlaWdodCArPSAxICogc3RlcFdpZHRoO1xyXG4gICAgfVxyXG4gICAgaWYgKF9ldmVudC5jb2RlID09IGYuS0VZQk9BUkRfQ09ERS5FKSB7XHJcbiAgICAgIGhlaWdodCAtPSAxICogc3RlcFdpZHRoO1xyXG4gICAgfVxyXG4gICAgbGV0IHBvczogZi5WZWN0b3IzID0gbW92ZWFibGVUcmFuc2Zvcm0ubG9jYWwudHJhbnNsYXRpb247XHJcbiAgICBwb3MuYWRkKG5ldyBmLlZlY3RvcjMoaG9yaXpvbnRhbCwgaGVpZ2h0LCB2ZXJ0aWNhbCkpO1xyXG4gICAgbW92ZWFibGVUcmFuc2Zvcm0ubG9jYWwudHJhbnNsYXRpb24gPSBwb3M7XHJcbiAgfVxyXG5cclxufSJdfQ==