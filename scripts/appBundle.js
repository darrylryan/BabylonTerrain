/// <reference path="typings/babylon.d.ts" />
/// <reference path="typings/jquery.d.ts" />
var canvas;
var engine;
var scene;
var divFps;
var camera;
var skybox;
var water;
function createScene() {
    var scene = new BABYLON.Scene(engine);
    camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(5, 5, 10), scene);
    camera.speed = 1;
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.checkCollisions = false;
    camera.applyGravity = true;
    camera.ellipsoid = new BABYLON.Vector3(1, 1, 1);
    camera.keysUp.push(90); // Z
    camera.keysUp.push(87); // W
    camera.keysDown.push(83); // S
    camera.keysLeft.push(65); // A
    camera.keysLeft.push(81); // Q
    camera.keysRight.push(69); // E
    camera.keysRight.push(68); // D
    scene.gravity = new BABYLON.Vector3(0, -0.9, 0);
    scene.collisionsEnabled = true;
    scene.activeCameras.push(camera);
    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    var sun = new BABYLON.PointLight("Omni", new BABYLON.Vector3(20, 100, 2), scene);
    light.intensity = 0.7;
    //  // Skybox
    skybox = BABYLON.Mesh.CreateBox("skyBox", 1000.0, scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("textures/skybox/skybox", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skybox.material = skyboxMaterial;
    var terrain = new BABYLON.Terrain("terrain", scene);
    // Bloom
    var blurWidth = 2.0;
    var postProcess0 = new BABYLON.PassPostProcess("Scene copy", 1.0, camera);
    var postProcess1 = new BABYLON.PostProcess("Down sample", "./materials/downsample", ["screenSize", "highlightThreshold"], null, 0.5, camera, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
    postProcess1.onApply = function (effect) {
        effect.setFloat2("screenSize", postProcess1.width, postProcess1.height);
        effect.setFloat("highlightThreshold", 0.85);
    };
    var postProcess2 = new BABYLON.BlurPostProcess("Horizontal blur", new BABYLON.Vector2(1.0, 0), blurWidth, 0.5, camera, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
    var postProcess3 = new BABYLON.BlurPostProcess("Vertical blur", new BABYLON.Vector2(0, 1.0), blurWidth, 0.5, camera, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
    var postProcess4 = new BABYLON.PostProcess("Final compose", "./materials/compose", ["sceneIntensity", "glowIntensity", "highlightIntensity"], ["sceneSampler"], 1, camera);
    postProcess4.onApply = function (effect) {
        effect.setTextureFromPostProcess("sceneSampler", postProcess0);
        effect.setFloat("sceneIntensity", 0.6);
        effect.setFloat("glowIntensity", 0.5);
        effect.setFloat("highlightIntensity", 0.8);
    };
    return scene;
}
document.addEventListener("DOMContentLoaded", function () {
    if (BABYLON.Engine.isSupported()) {
        canvas = document.getElementById("renderCanvas");
        engine = new BABYLON.Engine(canvas, true);
        divFps = document.getElementById("fps");
        scene = createScene();
        // Resize
        window.addEventListener("resize", function () {
            engine.resize();
        });
        camera.attachControl(canvas, false);
        engine.runRenderLoop(function () {
            if (divFps)
                divFps.innerHTML = engine.getFps().toFixed() + " fps";
            scene.render();
            // Animations
            skybox.rotation.y += 0.0001;
            skybox.position = camera.position;
        });
    }
}, false);
var BABYLON;
(function (BABYLON) {
    var Terrain = (function () {
        function Terrain(name, scene) {
            //Number of rings
            this.gridLevels = 8;
            //Resolution of grid
            this.gridSize = 128;
            this.gridScale = 0.3;
            this.rings = [];
            Terrain.terrainAlbedo = new BABYLON.Texture("./textures/albedo.png", scene);
            Terrain.materialMix = new BABYLON.Texture("./textures/mix.png", scene);
            Terrain.rockColor = new BABYLON.Texture("./textures/rock-color.png", scene);
            Terrain.grassColor = new BABYLON.Texture("./textures/grass-color.png", scene);
            Terrain.dirtColor = new BABYLON.Texture("./textures/dirt-color.png", scene);
            this.LoadHeights(scene);
            this.patch = new BABYLON.TerrainPatch("terrainpatch", scene, this.gridSize, this.gridScale);
            for (var level = 0; level < this.gridLevels; level++) {
                var scale = this.gridScale * Math.pow(2, level + 1);
                var ring = new BABYLON.TerrainRing("terrainring_" + level, scene, this.gridSize, scale);
                this.rings.push(ring);
            }
        }
        Terrain.prototype.LoadHeights = function (scene) {
            var size = Terrain.textureSize;
            var encodedHeight = new BABYLON.Texture("./textures/proc/terrainheight/textures/height.png", scene, false, true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
            Terrain.terrainHeight = new BABYLON.CustomProceduralTexture("terrainheight", "./textures/proc/terrainheight", size, scene);
            Terrain.terrainHeight.setTexture("source", encodedHeight);
            Terrain.terrainHeight.setVector2("viewport", new BABYLON.Vector2(size, size));
            Terrain.terrainHeight.setFloat("scaleFactor", 0.136439830834);
            var encodedDirtHeight = new BABYLON.Texture("./textures/proc/terrainheight/textures/dirt-height.png", scene);
            Terrain.dirtHeight = new BABYLON.CustomProceduralTexture("dirtheight", "./textures/proc/terrainheight", size, scene);
            Terrain.dirtHeight.setTexture("source", encodedHeight);
            Terrain.dirtHeight.setVector2("viewport", new BABYLON.Vector2(size, size));
            Terrain.dirtHeight.setFloat("scaleFactor", 0.0450444817543);
            var encodedGrassHeight = new BABYLON.Texture("./textures/proc/terrainheight/textures/grass-height.png", scene);
            Terrain.grassHeight = new BABYLON.CustomProceduralTexture("grassheight", "./textures/proc/terrainheight", size, scene);
            Terrain.grassHeight.setTexture("source", encodedHeight);
            Terrain.grassHeight.setVector2("viewport", new BABYLON.Vector2(size, size));
            Terrain.grassHeight.setFloat("scaleFactor", 0.083146572113);
            var encodedRockHeight = new BABYLON.Texture("./textures/proc/terrainheight/textures/rock-height.png", scene);
            Terrain.rockHeight = new BABYLON.CustomProceduralTexture("rockheight", "./textures/proc/terrainheight", size, scene);
            Terrain.rockHeight.setTexture("source", encodedHeight);
            Terrain.rockHeight.setVector2("viewport", new BABYLON.Vector2(size, size));
            Terrain.rockHeight.setFloat("scaleFactor", 0.0247397422791);
        };
        Terrain.detailScale = 0.02;
        Terrain.textureScale = 30;
        Terrain.textureSize = 512;
        return Terrain;
    })();
    BABYLON.Terrain = Terrain;
})(BABYLON || (BABYLON = {}));
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var TerrainPatch = (function (_super) {
        __extends(TerrainPatch, _super);
        function TerrainPatch(name, scene, gridSize, gridScale, parent, source, doNotCloneChildren) {
            if (parent === void 0) { parent = null; }
            _super.call(this, name, scene, parent, source, doNotCloneChildren);
            this.vertices = [];
            this.barycentrics = [];
            this.indices = [];
            this.gridSize = gridSize;
            this.gridScale = gridScale;
            this.CreatePatch(this.gridSize);
            this.alwaysSelectAsActiveMesh = true;
            this.setVerticesData(BABYLON.VertexBuffer.PositionKind, this.vertices, true, 3);
            this.setIndices(this.indices);
            this.terrainShader = new BABYLON.ShaderMaterial("patch", scene, './materials/terrain', {
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
            this.terrainShader.setFloat("textureScale", BABYLON.Terrain.textureScale);
            this.terrainShader.setVector3("camera", scene.activeCamera.position);
            this.terrainShader.setTexture("uTerrain", BABYLON.Terrain.terrainHeight);
            this.terrainShader.setTexture("uAlbedo", BABYLON.Terrain.terrainAlbedo);
            this.terrainShader.setTexture("uRockHeight", BABYLON.Terrain.rockHeight);
            this.terrainShader.setTexture("uGrassHeight", BABYLON.Terrain.grassHeight);
            this.terrainShader.setTexture("uDirtHeight", BABYLON.Terrain.dirtHeight);
            this.terrainShader.setTexture("uRockColor", BABYLON.Terrain.rockColor);
            this.terrainShader.setTexture("uGrassColor", BABYLON.Terrain.grassColor);
            this.terrainShader.setTexture("uDirtColor", BABYLON.Terrain.dirtColor);
            this.terrainShader.setTexture("uMaterialMix", BABYLON.Terrain.materialMix);
            this.terrainShader.setFloat("terrainSize", BABYLON.Terrain.textureSize);
            this.terrainShader.setFloat("detailSize", BABYLON.Terrain.textureSize);
            this.terrainShader.setFloat("detailScale", BABYLON.Terrain.detailScale);
            this.terrainShader.setVector3("dirtAvg", new BABYLON.Vector3(0.287469395055, 0.120516057539, 0.0431425926961));
            this.terrainShader.setVector3("grassAvg", new BABYLON.Vector3(0.24244317307, 0.284209597124, 0.00726620932363));
            this.terrainShader.setVector3("rockAvg", new BABYLON.Vector3(0.451768651247, 0.451768651247, 0.451768651247));
        }
        Object.defineProperty(TerrainPatch.prototype, "material", {
            get: function () {
                return this.terrainShader;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainPatch.prototype, "isPickable", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainPatch.prototype, "checkCollisions", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        TerrainPatch.prototype._bind = function (subMesh, effect, fillMode) {
            var engine = this.getScene().getEngine();
            var vertbuffer = this._geometry.getVertexBuffer(BABYLON.VertexBuffer.PositionKind).getBuffer();
            var indbuffer = this._geometry.getIndexBuffer();
            engine.setDepthBuffer(true);
            engine.bindBuffers(vertbuffer, indbuffer, [3], 3 * 4, this.terrainShader.getEffect());
        };
        TerrainPatch.prototype._draw = function (subMesh, fillMode, instancesCount) {
            if (!this._geometry || !this._geometry.getVertexBuffers() || !this._geometry.getIndexBuffer()) {
                return;
            }
            var engine = this.getScene().getEngine();
            engine.draw(true, subMesh.indexStart, subMesh.indexCount);
        };
        TerrainPatch.prototype.intersects = function (ray, fastCheck) {
            return null;
        };
        TerrainPatch.prototype.dispose = function (doNotRecurse) {
            this.terrainShader.dispose();
            _super.prototype.dispose.call(this, doNotRecurse);
        };
        TerrainPatch.prototype.clone = function (name, newParent, doNotCloneChildren) {
            return new TerrainPatch(name, this.getScene(), this.gridSize, this.gridScale, newParent, this, doNotCloneChildren);
        };
        TerrainPatch.prototype.CreatePatch = function (size) {
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];
            var row, col;
            var width = size;
            var height = size;
            var subdivisions = size;
            for (row = 0; row <= subdivisions; row++) {
                for (col = 0; col <= subdivisions; col++) {
                    var position = new BABYLON.Vector3((col * width) / subdivisions - (width / 2.0), 0, ((subdivisions - row) * height) / subdivisions - (height / 2.0));
                    var normal = new BABYLON.Vector3(0, 1.0, 0);
                    positions.push(position.x, position.y, position.z);
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
            this.indices = indices;
            this.vertices = positions;
            this.barycentrics = normals;
        };
        return TerrainPatch;
    })(BABYLON.Mesh);
    BABYLON.TerrainPatch = TerrainPatch;
})(BABYLON || (BABYLON = {}));
var BABYLON;
(function (BABYLON) {
    var TerrainRing = (function (_super) {
        __extends(TerrainRing, _super);
        function TerrainRing(name, scene, gridSize, gridScale, parent, source, doNotCloneChildren) {
            if (parent === void 0) { parent = null; }
            _super.call(this, name, scene, parent, source, doNotCloneChildren);
            this.gridScale = gridScale;
            this.gridSize = gridSize;
            this.CreateRing(this.gridSize);
            this.alwaysSelectAsActiveMesh = true;
            this.terrainShader = new BABYLON.ShaderMaterial("ring" + gridScale, scene, './materials/terrain', {
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
            this.terrainShader.setFloat("textureScale", BABYLON.Terrain.textureScale);
            this.terrainShader.setVector3("camera", scene.activeCamera.position);
            this.terrainShader.setTexture("uTerrain", BABYLON.Terrain.terrainHeight);
            this.terrainShader.setTexture("uAlbedo", BABYLON.Terrain.terrainAlbedo);
            this.terrainShader.setTexture("uRockHeight", BABYLON.Terrain.rockHeight);
            this.terrainShader.setTexture("uGrassHeight", BABYLON.Terrain.grassHeight);
            this.terrainShader.setTexture("uDirtHeight", BABYLON.Terrain.dirtHeight);
            this.terrainShader.setTexture("uRockColor", BABYLON.Terrain.rockColor);
            this.terrainShader.setTexture("uGrassColor", BABYLON.Terrain.grassColor);
            this.terrainShader.setTexture("uDirtColor", BABYLON.Terrain.dirtColor);
            this.terrainShader.setTexture("uMaterialMix", BABYLON.Terrain.materialMix);
            this.terrainShader.setFloat("terrainSize", BABYLON.Terrain.textureSize);
            this.terrainShader.setFloat("detailSize", BABYLON.Terrain.textureSize);
            this.terrainShader.setFloat("detailScale", BABYLON.Terrain.detailScale);
            this.terrainShader.setVector3("dirtAvg", new BABYLON.Vector3(0.287469395055, 0.120516057539, 0.0431425926961));
            this.terrainShader.setVector3("grassAvg", new BABYLON.Vector3(0.24244317307, 0.284209597124, 0.00726620932363));
            this.terrainShader.setVector3("rockAvg", new BABYLON.Vector3(0.451768651247, 0.451768651247, 0.451768651247));
        }
        Object.defineProperty(TerrainRing.prototype, "material", {
            get: function () {
                return this.terrainShader;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainRing.prototype, "isPickable", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainRing.prototype, "checkCollisions", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        TerrainRing.prototype._bind = function (subMesh, effect, fillMode) {
            var engine = this.getScene().getEngine();
            var vertbuffer = this._geometry.getVertexBuffer(BABYLON.VertexBuffer.PositionKind).getBuffer();
            var indbuffer = this._geometry.getIndexBuffer();
            engine.setDepthBuffer(true);
            engine.bindBuffers(vertbuffer, indbuffer, [3], 3 * 4, this.terrainShader.getEffect());
        };
        TerrainRing.prototype._draw = function (subMesh, fillMode, instancesCount) {
            if (!this._geometry || !this._geometry.getVertexBuffers() || !this._geometry.getIndexBuffer()) {
                return;
            }
            var engine = this.getScene().getEngine();
            engine.draw(true, subMesh.indexStart, subMesh.indexCount);
        };
        TerrainRing.prototype.intersects = function (ray, fastCheck) {
            return null;
        };
        TerrainRing.prototype.dispose = function (doNotRecurse) {
            this.terrainShader.dispose();
            _super.prototype.dispose.call(this, doNotRecurse);
        };
        TerrainRing.prototype.clone = function (name, newParent, doNotCloneChildren) {
            return new TerrainRing(name, this.getScene(), this.gridSize, this.gridScale, newParent, this, doNotCloneChildren);
        };
        TerrainRing.prototype.CreateStrip = function (size, side) {
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];
            var row, col;
            var width = size;
            var height = size;
            var subdivisions = size;
            var offsetX = 0;
            var offsetZ = 0;
            switch (side) {
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
                    var position = new BABYLON.Vector3((col * width) / subdivisions - (width / 2.0), 0, ((subdivisions - row) * height) / subdivisions - (height / 2.0));
                    var normal = new BABYLON.Vector3(0, 1.0, 0);
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
            var data = new BABYLON.VertexData();
            data.indices = indices;
            data.positions = positions;
            data.normals = normals;
            return data;
        };
        TerrainRing.prototype.CreateRing = function (size) {
            var sides = [];
            for (var i = 1; i <= 4; i++) {
                var strip = this.CreateStrip(size, i);
                sides[i] = new BABYLON.Mesh("ringside_" + i, this.getScene());
                strip.applyToMesh(sides[i]);
            }
            var mesh = BABYLON.Mesh.MergeMeshes(sides, true, true);
            mesh.geometry.applyToMesh(this);
            mesh.dispose();
        };
        return TerrainRing;
    })(BABYLON.Mesh);
    BABYLON.TerrainRing = TerrainRing;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=appBundle.js.map