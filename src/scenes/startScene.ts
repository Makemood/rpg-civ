import islandJSON from '../assets/durotar.json'
import { Enemy } from '../entities/enemy';
import { Player } from '../entities/player';
import { LAYERS, SIZES, SPRITES, TILES } from '../utils/constants';
export class Durotar extends Phaser.Scene{
    private player?: Player;
    private boar: Enemy;
    constructor(){
        super('DurotarScene');
    }

    preload () {
        this.load.image(TILES.Durotar,'src/assets/durotar.png')
        this.load.tilemapTiledJSON('map', 'src/assets/durotar.json')
        this.load.spritesheet(SPRITES.PLAYER,'src/assets/characters/alliance.png', {
            frameWidth: SIZES.PLAYER.WIDTH,
            frameHeight:SIZES.PLAYER.HEIGHT
        })

        this.load.spritesheet(SPRITES.BOAR.base,'src/assets/characters/boar.png', {
            frameWidth: SIZES.PLAYER.WIDTH,
            frameHeight:SIZES.PLAYER.HEIGHT
        })

    }

    create () {
        const map = this.make.tilemap({key: 'map'});
        const tileset = map.addTilesetImage(islandJSON.tilesets[0].name, TILES.Durotar, SIZES.TILE, SIZES.TILE);;
        const groundLayer = map.createLayer(LAYERS.GROUND, tileset, 0,0);
        const wallsLayer = map.createLayer(LAYERS.WALLS, tileset, 0,0);

        this.player = new Player(this,400,250, SPRITES.PLAYER);
        this.boar = new Enemy(this,500,250,SPRITES.BOAR.base);
        this.boar.setPlayer(this.player);
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0,0,map.widthInPixels,map.heightInPixels);

        this.physics.world.setBounds(0,0,map.widthInPixels, map.heightInPixels);
        this.player.setCollideWorldBounds(true);

        this.physics.add.collider(this.player, wallsLayer);
        groundLayer.active= true;
        wallsLayer.setCollisionByExclusion([-1]);
    }
    update(_: number, delta: number): void {
        this.player.update(delta);
        this.boar.update();
    }
}