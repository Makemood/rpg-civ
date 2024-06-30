import islandJSON from '../assets/durotar.json'
import { Player } from '../entities/player';
import { LAYERS, SIZES, SPRITES, TILES } from '../utils/constants';
export class Durotar extends Phaser.Scene{
    private player?: Player;
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
    }

    create () {
        const map = this.make.tilemap({key: 'map'});
        const tileset = map.addTilesetImage(islandJSON.tilesets[0].name, TILES.Durotar, SIZES.TILE, SIZES.TILE);;
        const groundLayer = map.createLayer(LAYERS.GROUND, tileset, 0,0);
        const wallsLayer = map.createLayer(LAYERS.WALLS, tileset, 0,0);

        this.player = new Player(this,400,250, SPRITES.PLAYER)
    }
    update(time: number, delta: number): void {
        this.player.update(delta);
    }
}