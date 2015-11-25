module BABYLON {

    export class Terrain {

        //Number of rings
        gridLevels: number = 8;
        //Resolution of grid
        gridSize: number = 128;
        gridScale: number = 0.3;
        public static  detailScale: number = 0.02;
        public static  textureScale: number = 30;
        terrainShader: BABYLON.ShaderMaterial;


        public static textureSize: number = 512;
        public patch: TerrainPatch;
        public rings: TerrainRing[] = [];

        public static terrainAlbedo: BABYLON.Texture;
        public static  materialMix: BABYLON.Texture;
        public static rockColor: BABYLON.Texture;
        public static grassColor: BABYLON.Texture;
        public static dirtColor: BABYLON.Texture;

        public static terrainHeight: BABYLON.CustomProceduralTexture;
        public static dirtHeight: BABYLON.CustomProceduralTexture;
        public static grassHeight: BABYLON.CustomProceduralTexture;
        public static rockHeight: BABYLON.CustomProceduralTexture;

        constructor(name: string, scene: Scene) {


            Terrain.terrainAlbedo = new BABYLON.Texture("./textures/albedo.png", scene);
            Terrain.materialMix = new BABYLON.Texture("./textures/mix.png", scene);
            Terrain.rockColor = new BABYLON.Texture("./textures/rock-color.png", scene);
            Terrain.grassColor = new BABYLON.Texture("./textures/grass-color.png", scene);
            Terrain.dirtColor = new BABYLON.Texture("./textures/dirt-color.png", scene);
            
            this.LoadHeights(scene);

            this.patch = new BABYLON.TerrainPatch("terrainpatch", scene, this.gridSize, this.gridScale);

            for (var level = 0; level < this.gridLevels; level++)
            {
                var scale = this.gridScale * Math.pow(2, level + 1);
                var ring = new BABYLON.TerrainRing("terrainring_" + level, scene, this.gridSize, scale);
                this.rings.push(ring);
            }

        }

        LoadHeights(scene: BABYLON.Scene) {
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

            
            
        }
      

    }
}


