import { app } from 'app';
import * as PIXI from 'pixi.js';

export let ball: Ball;

const INITIAL_VELOCITY = 14;

export class Ball {
    public sprite: PIXI.Graphics = new PIXI.Graphics();
    public direction: boolean = true;

    private readonly radianMultiplier: number = Math.PI / 180;
    private readonly minAngle: number = 60;
    private readonly maxAngle: number = 120;
    private readonly ballHeight: number = 30;
    private ballHalfHeight: number = this.ballHeight / 2;
    private angle: number = Math.round((Math.random() * (this.maxAngle - this.minAngle) + this.minAngle) / 10) * 10;
    private velocity: number = INITIAL_VELOCITY;

    constructor(direction?: boolean) {
        this.sprite.beginFill(0xffffff);
        this.sprite.drawRect(0, 0, 30, 30);
        this.sprite.x = window.innerWidth / 2;
        this.sprite.y = window.innerHeight / 2;
        if (direction) {
            this.direction = direction;
        }
    }

    public setAngle (newAngle: number): void {
        this.angle = newAngle;
    }

    public invertAngle (): void {
        this.angle = 180 - this.angle;
    }

    public calculateRebound(): void {
        const xAxisCalculation = Math.sin(this.angle * this.radianMultiplier) * this.velocity;
        const yAxisCalculation = Math.cos(this.angle * this.radianMultiplier) * this.velocity;
        if (this.direction) {
            this.sprite.x += xAxisCalculation;
            this.sprite.y += yAxisCalculation;
        } else {
            this.sprite.x -= xAxisCalculation;
            this.sprite.y -= yAxisCalculation;
        }

    }

    public speedUp (): void {
        this.velocity = 1.5 * INITIAL_VELOCITY;
    }

    public slowDown(): void {
        this.velocity = INITIAL_VELOCITY;
    }

    public getHalfHeight(): number {
        return this.ballHalfHeight;
    }
}

export function createBall(direction?: boolean): void {
    ball = new Ball(direction);
    app.stage.addChild(ball.sprite);
}
