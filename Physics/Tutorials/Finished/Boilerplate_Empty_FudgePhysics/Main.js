"use strict";
///<reference types="../../../../Core/Build/FudgeCore.js"/>
var f = FudgeCore;
//Reference Fudge, getting code completion ready and creating a shortcut f to write FudgeCode more comfortably
var Turorials_FUDGEPhysics_Lesson1;
//Reference Fudge, getting code completion ready and creating a shortcut f to write FudgeCode more comfortably
(function (Turorials_FUDGEPhysics_Lesson1) {
    //Fudge Basic Variables
    window.addEventListener("load", init);
    const app = document.querySelector("canvas"); // The html element where the scene is drawn to
    let viewPort; // The scene visualization
    let hierarchy; // You're object scene tree
    //Physical Objects
    let bodies = new Array(); // Array of all physical objects in the scene to have a quick reference
    //Setting Variables
    //Function to initialize the Fudge Scene with a camera, light, viewport and PHYSCIAL Objects
    function init(_event) {
        hierarchy = new f.Node("Scene"); //create the root Node where every object is parented to. Should never be changed
        //PHYSICS - Basic Plane and Cube
        //Creating a physically static ground plane for our physics playground. A simple scaled cube but with physics type set to static
        bodies[0] = createCompleteNode("Ground", new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(0.2, 0.2, 0.2, 1))), new f.MeshCube(), 0, f.PHYSICS_TYPE.STATIC);
        bodies[0].mtxLocal.scale(new f.Vector3(14, 0.3, 14)); //Scale the body with it's standard ComponentTransform
        bodies[0].mtxLocal.rotateX(3, true); //Give it a slight rotation so the physical objects are sliding, always from left when it's after a scaling
        hierarchy.appendChild(bodies[0]); //Add the node to the scene by adding it to the scene-root
        //Creating some dynamic bodies - Same as static only a different physics interaction type
        bodies[1] = createCompleteNode("Cube_1", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(0.75, 0.8, 0.75, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.DYNAMIC, f.PHYSICS_GROUP.GROUP_2);
        bodies[1].mtxLocal.translate(new f.Vector3(0, 3.5, 0));
        hierarchy.appendChild(bodies[1]);
        //Standard Fudge Scene Initialization - Creating a directional light, a camera and initialize the viewport
        let cmpLight = new f.ComponentLight(new f.LightDirectional(f.Color.CSS("WHITE")));
        cmpLight.pivot.lookAt(new f.Vector3(0.5, -1, -0.8)); //Set light direction
        hierarchy.addComponent(cmpLight);
        let cmpCamera = new f.ComponentCamera();
        cmpCamera.backgroundColor = f.Color.CSS("GREY");
        cmpCamera.pivot.translate(new f.Vector3(2, 3.5, 17)); //Move camera far back so the whole scene is visible
        cmpCamera.pivot.lookAt(f.Vector3.ZERO()); //Set the camera matrix so that it looks at the center of the scene
        viewPort = new f.Viewport(); //Creating a viewport that is rendered onto the html canvas element
        viewPort.initialize("Viewport", hierarchy, cmpCamera, app); //initialize the viewport with the root node, camera and canvas
        //PHYSICS - Start using physics by telling the physics the scene root object. Physics will recalculate every transform and initialize
        f.Physics.start(hierarchy);
        //Important start the game loop after starting physics, so physics can use the current transform before it's first iteration
        f.Loop.addEventListener("loopFrame" /* LOOP_FRAME */, update); //Tell the game loop to call the update function on each frame
        f.Loop.start(); //Stard the game loop
    }
    //Function to animate/update the Fudge scene, commonly known as gameloop
    function update() {
        f.Physics.world.simulate(); //PHYSICS - Simulate physical changes each frame, parameter to set time between frames
        viewPort.draw(); // Draw the current Fudge Scene to the canvas
    }
    // Function to quickly create a node with multiple needed FudgeComponents, including a physics component
    function createCompleteNode(_name, _material, _mesh, _mass, _physicsType, _group = f.PHYSICS_GROUP.DEFAULT, _colType = f.COLLIDER_TYPE.CUBE) {
        //Standard Fudge Node Creation
        let node = new f.Node(_name); //Creating the node
        let cmpMesh = new f.ComponentMesh(_mesh); //Creating a mesh for the node
        let cmpMaterial = new f.ComponentMaterial(_material); //Creating a material for the node
        let cmpTransform = new f.ComponentTransform(); //Transform holding position/rotation/scaling of the node
        let cmpRigidbody = new f.ComponentRigidbody(_mass, _physicsType, _colType, _group); //Adding a physical body component to use physics
        node.addComponent(cmpMesh);
        node.addComponent(cmpMaterial);
        node.addComponent(cmpTransform);
        node.addComponent(cmpRigidbody); // <-- best practice to add physics component last
        return node;
    }
})(Turorials_FUDGEPhysics_Lesson1 || (Turorials_FUDGEPhysics_Lesson1 = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIk1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLDJEQUEyRDtBQUMzRCxJQUFPLENBQUMsR0FBRyxTQUFTLENBQUM7QUFDckIsOEdBQThHO0FBRTlHLElBQVUsOEJBQThCLENBK0V2QztBQWpGRCw4R0FBOEc7QUFFOUcsV0FBVSw4QkFBOEI7SUFFdEMsdUJBQXVCO0lBQ3ZCLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDdEMsTUFBTSxHQUFHLEdBQXNCLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQywrQ0FBK0M7SUFDaEgsSUFBSSxRQUFvQixDQUFDLENBQUMsMEJBQTBCO0lBQ3BELElBQUksU0FBaUIsQ0FBQyxDQUFDLDJCQUEyQjtJQUdsRCxrQkFBa0I7SUFDbEIsSUFBSSxNQUFNLEdBQWEsSUFBSSxLQUFLLEVBQUUsQ0FBQyxDQUFDLHVFQUF1RTtJQUczRyxtQkFBbUI7SUFJbkIsNEZBQTRGO0lBQzVGLFNBQVMsSUFBSSxDQUFDLE1BQWE7UUFFekIsU0FBUyxHQUFHLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGlGQUFpRjtRQUVsSCxnQ0FBZ0M7UUFDaEMsZ0lBQWdJO1FBQ2hJLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FB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Uyw4QkFBOEIsS0FBOUIsOEJBQThCLFFBK0V2QyIsInNvdXJjZXNDb250ZW50IjpbIi8vLzxyZWZlcmVuY2UgdHlwZXM9XCIuLi8uLi8uLi8uLi9Db3JlL0J1aWxkL0Z1ZGdlQ29yZS5qc1wiLz5cclxuaW1wb3J0IGYgPSBGdWRnZUNvcmU7XHJcbi8vUmVmZXJlbmNlIEZ1ZGdlLCBnZXR0aW5nIGNvZGUgY29tcGxldGlvbiByZWFkeSBhbmQgY3JlYXRpbmcgYSBzaG9ydGN1dCBmIHRvIHdyaXRlIEZ1ZGdlQ29kZSBtb3JlIGNvbWZvcnRhYmx5XHJcblxyXG5uYW1lc3BhY2UgVHVyb3JpYWxzX0ZVREdFUGh5c2ljc19MZXNzb24xIHtcclxuXHJcbiAgLy9GdWRnZSBCYXNpYyBWYXJpYWJsZXNcclxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgaW5pdCk7XHJcbiAgY29uc3QgYXBwOiBIVE1MQ2FudmFzRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJjYW52YXNcIik7IC8vIFRoZSBodG1sIGVsZW1lbnQgd2hlcmUgdGhlIHNjZW5lIGlzIGRyYXduIHRvXHJcbiAgbGV0IHZpZXdQb3J0OiBmLlZpZXdwb3J0OyAvLyBUaGUgc2NlbmUgdmlzdWFsaXphdGlvblxyXG4gIGxldCBoaWVyYXJjaHk6IGYuTm9kZTsgLy8gWW91J3JlIG9iamVjdCBzY2VuZSB0cmVlXHJcblxyXG5cclxuICAvL1BoeXNpY2FsIE9iamVjdHNcclxuICBsZXQgYm9kaWVzOiBmLk5vZGVbXSA9IG5ldyBBcnJheSgpOyAvLyBBcnJheSBvZiBhbGwgcGh5c2ljYWwgb2JqZWN0cyBpbiB0aGUgc2NlbmUgdG8gaGF2ZSBhIHF1aWNrIHJlZmVyZW5jZVxyXG5cclxuXHJcbiAgLy9TZXR0aW5nIFZhcmlhYmxlc1xyXG5cclxuXHJcblxyXG4gIC8vRnVuY3Rpb24gdG8gaW5pdGlhbGl6ZSB0aGUgRnVkZ2UgU2NlbmUgd2l0aCBhIGNhbWVyYSwgbGlnaHQsIHZpZXdwb3J0IGFuZCBQSFlTQ0lBTCBPYmplY3RzXHJcbiAgZnVuY3Rpb24gaW5pdChfZXZlbnQ6IEV2ZW50KTogdm9pZCB7XHJcblxyXG4gICAgaGllcmFyY2h5ID0gbmV3IGYuTm9kZShcIlNjZW5lXCIpOyAvL2NyZWF0ZSB0aGUgcm9vdCBOb2RlIHdoZXJlIGV2ZXJ5IG9iamVjdCBpcyBwYXJlbnRlZCB0by4gU2hvdWxkIG5ldmVyIGJlIGNoYW5nZWRcclxuXHJcbiAgICAvL1BIWVNJQ1MgLSBCYXNpYyBQbGFuZSBhbmQgQ3ViZVxyXG4gICAgLy9DcmVhdGluZyBhIHBoeXNpY2FsbHkgc3RhdGljIGdyb3VuZCBwbGFuZSBmb3Igb3VyIHBoeXNpY3MgcGxheWdyb3VuZC4gQSBzaW1wbGUgc2NhbGVkIGN1YmUgYnV0IHdpdGggcGh5c2ljcyB0eXBlIHNldCB0byBzdGF0aWNcclxuICAgIGJvZGllc1swXSA9IGNyZWF0ZUNvbXBsZXRlTm9kZShcIkdyb3VuZFwiLCBuZXcgZi5NYXRlcmlhbChcIkdyb3VuZFwiLCBmLlNoYWRlckZsYXQsIG5ldyBmLkNvYXRDb2xvcmVkKG5ldyBmLkNvbG9yKDAuMiwgMC4yLCAwLjIsIDEpKSksIG5ldyBmLk1lc2hDdWJlKCksIDAsIGYuUEhZU0lDU19UWVBFLlNUQVRJQyk7XHJcbiAgICBib2RpZXNbMF0ubXR4TG9jYWwuc2NhbGUobmV3IGYuVmVjdG9yMygxNCwgMC4zLCAxNCkpOyAvL1NjYWxlIHRoZSBib2R5IHdpdGggaXQncyBzdGFuZGFyZCBDb21wb25lbnRUcmFuc2Zvcm1cclxuICAgIGJvZGllc1swXS5tdHhMb2NhbC5yb3RhdGVYKDMsIHRydWUpOyAvL0dpdmUgaXQgYSBzbGlnaHQgcm90YXRpb24gc28gdGhlIHBoeXNpY2FsIG9iamVjdHMgYXJlIHNsaWRpbmcsIGFsd2F5cyBmcm9tIGxlZnQgd2hlbiBpdCdzIGFmdGVyIGEgc2NhbGluZ1xyXG4gICAgaGllcmFyY2h5LmFwcGVuZENoaWxkKGJvZGllc1swXSk7IC8vQWRkIHRoZSBub2RlIHRvIHRoZSBzY2VuZSBieSBhZGRpbmcgaXQgdG8gdGhlIHNjZW5lLXJvb3RcclxuXHJcbiAgICAvL0NyZWF0aW5nIHNvbWUgZHluYW1pYyBib2RpZXMgLSBTYW1lIGFzIHN0YXRpYyBvbmx5IGEgZGlmZmVyZW50IHBoeXNpY3MgaW50ZXJhY3Rpb24gdHlwZVxyXG4gICAgYm9kaWVzWzFdID0gY3JlYXRlQ29tcGxldGVOb2RlKFwiQ3ViZV8xXCIsIG5ldyBmLk1hdGVyaWFsKFwiQ3ViZVwiLCBmLlNoYWRlckZsYXQsIG5ldyBmLkNvYXRDb2xvcmVkKG5ldyBmLkNvbG9yKDAuNzUsIDAuOCwgMC43NSwgMSkpKSwgbmV3IGYuTWVzaEN1YmUoKSwgMSwgZi5QSFlTSUNTX1RZUEUuRFlOQU1JQywgZi5QSFlTSUNTX0dST1VQLkdST1VQXzIpO1xyXG4gICAgYm9kaWVzWzFdLm10eExvY2FsLnRyYW5zbGF0ZShuZXcgZi5WZWN0b3IzKDAsIDMuNSwgMCkpO1xyXG4gICAgaGllcmFyY2h5LmFwcGVuZENoaWxkKGJvZGllc1sxXSk7XHJcblxyXG5cclxuICAgIC8vU3RhbmRhcmQgRnVkZ2UgU2NlbmUgSW5pdGlhbGl6YXRpb24gLSBDcmVhdGluZyBhIGRpcmVjdGlvbmFsIGxpZ2h0LCBhIGNhbWVyYSBhbmQgaW5pdGlhbGl6ZSB0aGUgdmlld3BvcnRcclxuICAgIGxldCBjbXBMaWdodDogZi5Db21wb25lbnRMaWdodCA9IG5ldyBmLkNvbXBvbmVudExpZ2h0KG5ldyBmLkxpZ2h0RGlyZWN0aW9uYWwoZi5Db2xvci5DU1MoXCJXSElURVwiKSkpO1xyXG4gICAgY21wTGlnaHQucGl2b3QubG9va0F0KG5ldyBmLlZlY3RvcjMoMC41LCAtMSwgLTAuOCkpOyAvL1NldCBsaWdodCBkaXJlY3Rpb25cclxuICAgIGhpZXJhcmNoeS5hZGRDb21wb25lbnQoY21wTGlnaHQpO1xyXG5cclxuICAgIGxldCBjbXBDYW1lcmE6IGYuQ29tcG9uZW50Q2FtZXJhID0gbmV3IGYuQ29tcG9uZW50Q2FtZXJhKCk7XHJcbiAgICBjbXBDYW1lcmEuYmFja2dyb3VuZENvbG9yID0gZi5Db2xvci5DU1MoXCJHUkVZXCIpO1xyXG4gICAgY21wQ2FtZXJhLnBpdm90LnRyYW5zbGF0ZShuZXcgZi5WZWN0b3IzKDIsIDMuNSwgMTcpKTsgLy9Nb3ZlIGNhbWVyYSBmYXIgYmFjayBzbyB0aGUgd2hvbGUgc2NlbmUgaXMgdmlzaWJsZVxyXG4gICAgY21wQ2FtZXJhLnBpdm90Lmxvb2tBdChmLlZlY3RvcjMuWkVSTygpKTsgLy9TZXQgdGhlIGNhbWVyYSBtYXRyaXggc28gdGhhdCBpdCBsb29rcyBhdCB0aGUgY2VudGVyIG9mIHRoZSBzY2VuZVxyXG5cclxuICAgIHZpZXdQb3J0ID0gbmV3IGYuVmlld3BvcnQoKTsgLy9DcmVhdGluZyBhIHZpZXdwb3J0IHRoYXQgaXMgcmVuZGVyZWQgb250byB0aGUgaHRtbCBjYW52YXMgZWxlbWVudFxyXG4gICAgdmlld1BvcnQuaW5pdGlhbGl6ZShcIlZpZXdwb3J0XCIsIGhpZXJhcmNoeSwgY21wQ2FtZXJhLCBhcHApOyAvL2luaXRpYWxpemUgdGhlIHZpZXdwb3J0IHdpdGggdGhlIHJvb3Qgbm9kZSwgY2FtZXJhIGFuZCBjYW52YXNcclxuXHJcbiAgICAvL1BIWVNJQ1MgLSBTdGFydCB1c2luZyBwaHlzaWNzIGJ5IHRlbGxpbmcgdGhlIHBoeXNpY3MgdGhlIHNjZW5lIHJvb3Qgb2JqZWN0LiBQaHlzaWNzIHdpbGwgcmVjYWxjdWxhdGUgZXZlcnkgdHJhbnNmb3JtIGFuZCBpbml0aWFsaXplXHJcbiAgICBmLlBoeXNpY3Muc3RhcnQoaGllcmFyY2h5KTtcclxuXHJcbiAgICAvL0ltcG9ydGFudCBzdGFydCB0aGUgZ2FtZSBsb29wIGFmdGVyIHN0YXJ0aW5nIHBoeXNpY3MsIHNvIHBoeXNpY3MgY2FuIHVzZSB0aGUgY3VycmVudCB0cmFuc2Zvcm0gYmVmb3JlIGl0J3MgZmlyc3QgaXRlcmF0aW9uXHJcbiAgICBmLkxvb3AuYWRkRXZlbnRMaXN0ZW5lcihmLkVWRU5ULkxPT1BfRlJBTUUsIHVwZGF0ZSk7IC8vVGVsbCB0aGUgZ2FtZSBsb29wIHRvIGNhbGwgdGhlIHVwZGF0ZSBmdW5jdGlvbiBvbiBlYWNoIGZyYW1lXHJcbiAgICBmLkxvb3Auc3RhcnQoKTsgLy9TdGFyZCB0aGUgZ2FtZSBsb29wXHJcbiAgfVxyXG5cclxuICAvL0Z1bmN0aW9uIHRvIGFuaW1hdGUvdXBkYXRlIHRoZSBGdWRnZSBzY2VuZSwgY29tbW9ubHkga25vd24gYXMgZ2FtZWxvb3BcclxuICBmdW5jdGlvbiB1cGRhdGUoKTogdm9pZCB7XHJcbiAgICBmLlBoeXNpY3Mud29ybGQuc2ltdWxhdGUoKTsgLy9QSFlTSUNTIC0gU2ltdWxhdGUgcGh5c2ljYWwgY2hhbmdlcyBlYWNoIGZyYW1lLCBwYXJhbWV0ZXIgdG8gc2V0IHRpbWUgYmV0d2VlbiBmcmFtZXNcclxuICAgIHZpZXdQb3J0LmRyYXcoKTsgLy8gRHJhdyB0aGUgY3VycmVudCBGdWRnZSBTY2VuZSB0byB0aGUgY2FudmFzXHJcbiAgfVxyXG5cclxuICAvLyBGdW5jdGlvbiB0byBxdWlja2x5IGNyZWF0ZSBhIG5vZGUgd2l0aCBtdWx0aXBsZSBuZWVkZWQgRnVkZ2VDb21wb25lbnRzLCBpbmNsdWRpbmcgYSBwaHlzaWNzIGNvbXBvbmVudFxyXG4gIGZ1bmN0aW9uIGNyZWF0ZUNvbXBsZXRlTm9kZShfbmFtZTogc3RyaW5nLCBfbWF0ZXJpYWw6IGYuTWF0ZXJpYWwsIF9tZXNoOiBmLk1lc2gsIF9tYXNzOiBudW1iZXIsIF9waHlzaWNzVHlwZTogZi5QSFlTSUNTX1RZUEUsIF9ncm91cDogZi5QSFlTSUNTX0dST1VQID0gZi5QSFlTSUNTX0dST1VQLkRFRkFVTFQsIF9jb2xUeXBlOiBmLkNPTExJREVSX1RZUEUgPSBmLkNPTExJREVSX1RZUEUuQ1VCRSk6IGYuTm9kZSB7XHJcbiAgICAvL1N0YW5kYXJkIEZ1ZGdlIE5vZGUgQ3JlYXRpb25cclxuICAgIGxldCBub2RlOiBmLk5vZGUgPSBuZXcgZi5Ob2RlKF9uYW1lKTsgLy9DcmVhdGluZyB0aGUgbm9kZVxyXG4gICAgbGV0IGNtcE1lc2g6IGYuQ29tcG9uZW50TWVzaCA9IG5ldyBmLkNvbXBvbmVudE1lc2goX21lc2gpOyAvL0NyZWF0aW5nIGEgbWVzaCBmb3IgdGhlIG5vZGVcclxuICAgIGxldCBjbXBNYXRlcmlhbDogZi5Db21wb25lbnRNYXRlcmlhbCA9IG5ldyBmLkNvbXBvbmVudE1hdGVyaWFsKF9tYXRlcmlhbCk7IC8vQ3JlYXRpbmcgYSBtYXRlcmlhbCBmb3IgdGhlIG5vZGVcclxuICAgIGxldCBjbXBUcmFuc2Zvcm06IGYuQ29tcG9uZW50VHJhbnNmb3JtID0gbmV3IGYuQ29tcG9uZW50VHJhbnNmb3JtKCk7ICAvL1RyYW5zZm9ybSBob2xkaW5nIHBvc2l0aW9uL3JvdGF0aW9uL3NjYWxpbmcgb2YgdGhlIG5vZGVcclxuICAgIGxldCBjbXBSaWdpZGJvZHk6IGYuQ29tcG9uZW50UmlnaWRib2R5ID0gbmV3IGYuQ29tcG9uZW50UmlnaWRib2R5KF9tYXNzLCBfcGh5c2ljc1R5cGUsIF9jb2xUeXBlLCBfZ3JvdXApOyAvL0FkZGluZyBhIHBoeXNpY2FsIGJvZHkgY29tcG9uZW50IHRvIHVzZSBwaHlzaWNzXHJcblxyXG4gICAgbm9kZS5hZGRDb21wb25lbnQoY21wTWVzaCk7XHJcbiAgICBub2RlLmFkZENvbXBvbmVudChjbXBNYXRlcmlhbCk7XHJcbiAgICBub2RlLmFkZENvbXBvbmVudChjbXBUcmFuc2Zvcm0pO1xyXG4gICAgbm9kZS5hZGRDb21wb25lbnQoY21wUmlnaWRib2R5KTsgLy8gPC0tIGJlc3QgcHJhY3RpY2UgdG8gYWRkIHBoeXNpY3MgY29tcG9uZW50IGxhc3RcclxuICAgIHJldHVybiBub2RlO1xyXG4gIH1cclxuXHJcblxyXG59Il19