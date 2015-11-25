module BABYLON {

    export class TerrainRing extends Mesh {
        gridSize: number;
        gridScale: number;
        terrainShader: ShaderMaterial;

        constructor(name: string, scene: Scene, gridSize: number, gridScale: number, parent: Node = null, source?: Mesh, doNotCloneChildren?: boolean) {
            super(name, scene, parent, source, doNotCloneChildren);
            this.gridScale = gridScale;
            this.gridSize = gridSize;
            this.CreateRing(this.gridSize);
            this.alwaysSelectAsActiveMesh = true;

            this.terrainShader = new BABYLON.ShaderMaterial("ring" + gridScale, scene, './materials/terrain',
                {
                    needAlphaBlending: false, needAlphaTesting: false, backfaceCulling: true,
                    attributes: ["position"],
                    uniforms: ["worldViewProjection", "gridSize", "gridScale",
                        "textureScale", "uTerrain", "uAlbedo", "camera", "terrainSize", "uRockColor", "uDirtColor", "uGrassColor",
                        "startGridScale", "uRockHeight", "uGrassHeight", "uDirtHeight", "uMaterialMix", "detailScale", "detailSize",
                        "showGridLines", "rockAvg", "dirtAvg", "grassAvg"]
                });
            

            this.terrainShader.setFloat("gridSize", this.gridSize);
            this.terrainShader.setFloat("gridScale", this.gridScale);
            this.terrainShader.setFloat("startGridScale", this.gridScale);
            this.terrainShader.setVector3("camera", scene.activeCamera.position);
            this.terrainShader.setFloat("textureScale", Terrain.textureScale);
            this.terrainShader.setVector3("camera", scene.activeCamera.position);
            this.terrainShader.setTexture("uTerrain", Terrain.terrainHeight);
            this.terrainShader.setTexture("uAlbedo", Terrain.terrainAlbedo);
            this.terrainShader.setTexture("uRockHeight", Terrain.rockHeight);
            this.terrainShader.setTexture("uGrassHeight", Terrain.grassHeight);
            this.terrainShader.setTexture("uDirtHeight", Terrain.dirtHeight);
            this.terrainShader.setTexture("uRockColor", Terrain.rockColor);
            this.terrainShader.setTexture("uGrassColor", Terrain.grassColor);
            this.terrainShader.setTexture("uDirtColor", Terrain.dirtColor);
            this.terrainShader.setTexture("uMaterialMix", Terrain.materialMix);
            this.terrainShader.setFloat("terrainSize", Terrain.textureSize);
            this.terrainShader.setFloat("detailSize", Terrain.textureSize);
            this.terrainShader.setFloat("detailScale", Terrain.detailScale);
            this.terrainShader.setVector3("dirtAvg", new BABYLON.Vector3(0.287469395055, 0.120516057539, 0.0431425926961));
            this.terrainShader.setVector3("grassAvg", new BABYLON.Vector3(0.24244317307, 0.284209597124, 0.00726620932363));
            this.terrainShader.setVector3("rockAvg", new BABYLON.Vector3(0.451768651247, 0.451768651247, 0.451768651247));
        }

        public get material(): Material {
            return this.terrainShader;
        }

        public get isPickable(): boolean {
            return false;
        }

        public get checkCollisions(): boolean {
            return false;
        }

        public _bind(subMesh: SubMesh, effect: Effect, fillMode: number): void {
            var engine = this.getScene().getEngine();
            var vertbuffer = this._geometry.getVertexBuffer(VertexBuffer.PositionKind).getBuffer();
            var indbuffer = this._geometry.getIndexBuffer();
            engine.setDepthBuffer(true);
            engine.bindBuffers(vertbuffer, indbuffer, [3], 3 * 4, this.terrainShader.getEffect());
        }

        public _draw(subMesh: SubMesh, fillMode: number, instancesCount?: number): void {
            if (!this._geometry || !this._geometry.getVertexBuffers() || !this._geometry.getIndexBuffer()) {
                return;
            }
            var engine = this.getScene().getEngine();
            engine.draw(true, subMesh.indexStart, subMesh.indexCount);

        }

        public intersects(ray: Ray, fastCheck?: boolean) {
            return null;
        }

        public dispose(doNotRecurse?: boolean): void {
            this.terrainShader.dispose();

            super.dispose(doNotRecurse);
        }

        public clone(name: string, newParent?: Node, doNotCloneChildren?: boolean): TerrainRing {
            return new TerrainRing(name, this.getScene(), this.gridSize, this.gridScale, newParent, this, doNotCloneChildren);
        }

        public CreateStrip(size: number, side: number): VertexData {

            var indices: number[] = [];
            var positions: number[] = [];
            var normals: number[] = [];
            var uvs: number[] = [];
            var row: number, col: number;

            var width: number = size;
            var height: number = size;
            var subdivisions: number = size;
            var offsetX = 0;
            var offsetZ = 0;

            switch (side)
            {
                case 1:
                    width /= 4;
                    offsetX += width * 1.5;
                    width += 1;
                    break;
                case 2:
                    width /= 4;
                    offsetX -= width * 1.5 - 1;
                    width += 1;
                    break;
                case 3:
                    height /= 4;
                    width /= 2;
                    offsetZ -= height * 1.5 - 1;
                    height += 1;
                    break;
                case 4:
                    height /= 4;
                    width /= 2;
                    offsetZ += height * 1.5;
                    height += 1;
                    break;
            }

            for (row = 0; row <= subdivisions; row++) {
                for (col = 0; col <= subdivisions; col++) {
                    var position = new Vector3((col * width) / subdivisions - (width / 2.0), 0, ((subdivisions - row) * height) / subdivisions - (height / 2.0));
                    var normal = new Vector3(0, 1.0, 0);
                    positions.push(position.x + offsetX, position.y, position.z + offsetZ);
                    normals.push(normal.x, normal.y, normal.z);
                    uvs.push(col / subdivisions, 1.0 - row / subdivisions);
                }
            }

            for (row = 0; row < subdivisions; row++) {
                for (col = 0; col < subdivisions; col++) {
                    indices.push(col + 1 + (row + 1) * (subdivisions + 1));
                    indices.push(col + 1 + row * (subdivisions + 1));
                    indices.push(col + row * (subdivisions + 1));

                    indices.push(col + (row + 1) * (subdivisions + 1));
                    indices.push(col + 1 + (row + 1) * (subdivisions + 1));
                    indices.push(col + row * (subdivisions + 1));
                }
            }
            var data: BABYLON.VertexData = new BABYLON.VertexData();

            data.indices = indices;
            data.positions = positions;
            data.normals = normals;

            return data;
        }


        public CreateRing(size: number) {

            var sides: Mesh[] = [];
            for (var i = 1; i <= 4; i++)
            {
                var strip = this.CreateStrip(size, i);
                sides[i] = new BABYLON.Mesh("ringside_" + i, this.getScene());
                strip.applyToMesh(sides[i]);
            }
            var mesh = BABYLON.Mesh.MergeMeshes(sides, true, true);
            mesh.geometry.applyToMesh(this);
            mesh.dispose();
        }

    }

}


