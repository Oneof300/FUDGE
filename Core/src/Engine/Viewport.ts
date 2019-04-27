namespace Fudge {
    export interface Rectangle {
        x: number;
        y: number;
        width: number;
        height: number;
    }

    /**
     * Represents the interface between the scenegraph, the camera and the renderingcontext.
     * @authors Jascha Karagöl, HFU, 2019 | Jirka Dell'Oro-Friedl, HFU, 2019
     */
    export class Viewport extends EventTarget {
        public name: string = "Viewport"; // The name to call this viewport by.
        public camera: ComponentCamera = null; // The camera from which's position and view the tree will be rendered.
        public branch: Node = null; // The first node in the tree(branch) that will be rendered.
        private crc2: CanvasRenderingContext2D = null;
        private rect: Rectangle = null;
        /**
         * Creates a new viewport scenetree with a passed rootnode and camera and initializes all nodes currently in the tree(branch).
         * @param _branch 
         * @param _camera 
         */
        public initialize(_name: string, _branch: Node, _camera: ComponentCamera, _canvas: HTMLCanvasElement): void {
            this.name = _name;
            this.branch = _branch;
            this.camera = _camera;
            this.crc2 = _canvas.getContext("2d");
            this.rect = { x: 0, y: 0, width: _canvas.width, height: _canvas.height };
        }

        /**
         * Prepares canvas for new draw, updates the worldmatrices of all nodes and calls drawObjects().
         */
        public draw(): void {
            if (this.camera.isActive) {
                this.prepare();
                // HACK! no need to addBranch and recalc for each viewport and frame
                WebGL.addBranch(this.branch);
                WebGL.drawBranch(this.branch, this.camera);

                // TODO: provide for rendering on only a part of canvas, viewport share common canvas
                let rectSource: Rectangle = WebGLApi.getRect();
                this.crc2.drawImage(
                    WebGLApi.getCanvas(),
                    rectSource.x, rectSource.y, rectSource.width, rectSource.height,
                    this.rect.x, this.rect.y, this.rect.width, this.rect.height);
            }
        }

        public prepare(): void {
            this.updateCanvasDisplaySizeAndCamera(this.crc2.canvas);
            let backgroundColor: Vector3 = this.camera.getBackgoundColor();
            WebGLApi.crc3.clearColor(backgroundColor.x, backgroundColor.y, backgroundColor.z, this.camera.getBackgroundEnabled() ? 1 : 0);
            WebGLApi.crc3.clear(WebGLApi.crc3.COLOR_BUFFER_BIT | WebGLApi.crc3.DEPTH_BUFFER_BIT);
            // Enable backface- and zBuffer-culling.
            WebGLApi.crc3.enable(WebGLApi.crc3.CULL_FACE);
            WebGLApi.crc3.enable(WebGLApi.crc3.DEPTH_TEST);
        }

        /**
         * Logs this viewports scenegraph to the console.
         */
        public showSceneGraph(): void {
            let output: string = "SceneGraph for this viewport:";
            output += "\n \n";
            output += this.branch.name;
            console.log(output + "   => ROOTNODE" + this.createSceneGraph(this.branch));
        }

        /**
         * Creates an outputstring as visual representation of this viewports scenegraph. Called for the passed node and recursive for all its children.
         * @param _fudgeNode The node to create a scenegraphentry for.
         */
        private createSceneGraph(_fudgeNode: Node): string {
            let output: string = "";
            for (let name in _fudgeNode.getChildren()) {
                let child: Node = _fudgeNode.getChildren()[name];
                output += "\n";
                let current: Node = child;
                if (current.getParent() && current.getParent().getParent())
                    output += "|";
                while (current.getParent() && current.getParent().getParent()) {
                    output += "   ";
                    current = current.getParent();
                }
                output += "'--";

                output += child.name;
                output += this.createSceneGraph(child);
            }
            return output;
        }

        /**
         * Updates the displaysize of the passed canvas depending on the client's size and an optional multiplier.
         * Adjusts the viewports camera and the renderingcontexts viewport to fit the canvassize.
         * @param canvas The canvas to readjust.
         * @param multiplier A multiplier to adjust the displayzise dimensions by.
         */
        private updateCanvasDisplaySizeAndCamera(canvas: HTMLCanvasElement, multiplier?: number): void {
            multiplier = multiplier || 1;
            let width: number = canvas.clientWidth * multiplier | 0;
            let height: number = canvas.clientHeight * multiplier | 0;
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
            }
            // TODO: camera should adjust itself to resized canvas by e.g. this.camera.resize(...)
            if (this.camera.isOrthographic)
                this.camera.projectOrthographic(0, width, height, 0);
            else
                this.camera.projectCentral(width / height); //, this.camera.FieldOfView);
            WebGLApi.crc3.viewport(0, 0, width, height);
        }


        /*/*
         * Initializes the colorbuffer for a node depending on its mesh- and materialcomponent.
         * @param _material The node's materialcomponent.
         * @param _mesh The node's meshcomponent.
         */
        // private initializeNodeMaterial(_materialComponent: ComponentMaterial, _meshComponent: ComponentMesh): void {
        //     // let colorBuffer: WebGLBuffer = GLUtil.assert<WebGLBuffer>(gl2.createBuffer());
        //     // gl2.bindBuffer(gl2.ARRAY_BUFFER, colorBuffer);
        //     // _meshComponent.applyColor(_materialComponent);
        //     //gl2.enableVertexAttribArray(colorUniformLocation);
        //     // GLUtil.attributePointer(colorUniformLocation, _materialComponent.Material.ColorBufferSpecification);
        // }

        /*/*
         * Initializes the texturebuffer for a node, depending on its mesh- and materialcomponent.
         * @param _material The node's materialcomponent.
         * @param _mesh The node's meshcomponent.
         */
        // private initializeNodeTexture(_materialComponent: ComponentMaterial, _meshComponent: ComponentMesh): void {
        //     let textureCoordinateAttributeLocation: number = _materialComponent.Material.TextureCoordinateLocation;
        //     let textureCoordinateBuffer: WebGLBuffer = gl2.createBuffer();
        //     gl2.bindBuffer(gl2.ARRAY_BUFFER, textureCoordinateBuffer);
        //     _meshComponent.setTextureCoordinates();
        //     gl2.enableVertexAttribArray(textureCoordinateAttributeLocation);
        //     GLUtil.attributePointer(textureCoordinateAttributeLocation, _materialComponent.Material.TextureBufferSpecification);
        //     GLUtil.createTexture(_materialComponent.Material.TextureSource);
        // }
    }
}
