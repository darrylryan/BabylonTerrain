/// <reference path="typings/babylon.d.ts" />
/// <reference path="typings/jquery.d.ts" />

var canvas: HTMLCanvasElement;
var engine: BABYLON.Engine;
var scene: BABYLON.Scene;
var divFps: HTMLElement;
var camera: BABYLON.FreeCamera;
var skybox: BABYLON.Mesh;
var water: BABYLON.Mesh;

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


    canvas = <HTMLCanvasElement>document.getElementById("renderCanvas");
    engine = new BABYLON.Engine(canvas, true);
    divFps = <HTMLElement>document.getElementById("fps");
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

