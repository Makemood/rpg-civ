import { Entity } from "./entity";

export class Enemy extends Entity{
    private player: Entity;
    isFollowing = false;
    attackRange: number;
    followRange: number;
    moveSpeed: number;
    isAlive: boolean;
    initialPosition: { x: number; y: number; };

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string){
        super(scene, x, y, texture);


        this.initialPosition = {x,y};
        this.cycleTween();
        this.setFlipX(true);
        this.isFollowing = false;
        this.isAlive = true;
        this.attackRange = 54;
        this.followRange = 250;
        this.moveSpeed = 100;
    }

    cycleTween ()
    {
        this.scene.tweens.add({
            targets:this,
            
            duration: 2000,
            
            repeat: -1,

            yoyo: true,
            x: this.x +100,

            //callback

            onRepeat: () => {
                this.setFlipX(true);
            },

            onYoyo: () => {
                this.setFlipX(false);
            }
        })
    }
    stopCycleTween()
    {
        this.scene.tweens.killTweensOf(this);
    } 
    setPlayer(player: Entity)
    {
        this.player =  player;
    }
    followToPlayer(player){
        this.scene.physics.moveToObject(this, player, this.moveSpeed);
    }
    returnToOriginPos(distanceToPos){
        this.setVelocity(0,0);

        this.scene.tweens.add({
            targets: this,
            x: this.initialPosition.x,
            y: this.initialPosition.y,
            duration: distanceToPos * 1000/ this.moveSpeed,
            onComplete: () => {
                this.cycleTween();
            }
        })
    }
    update(...args: any[]): void {
        const player = this.player;
        const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        const distanceToPos = Phaser.Math.Distance.Between(this.x,this.y, this.initialPosition.x, this.initialPosition.y )
        if(!this.isFollowing && distanceToPlayer < 100){
            this.isFollowing = true;
            this.stopCycleTween()
        }

        if(this.isFollowing && this.isAlive){
            this.followToPlayer(player);
            if(distanceToPlayer < this.attackRange){
                this.setVelocity(0,0);
            }

            if(distanceToPos > this.followRange){
                this.isFollowing = false;
                this.returnToOriginPos(distanceToPos);
            }
        }
    }
    
}