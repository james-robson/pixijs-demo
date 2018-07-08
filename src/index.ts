import * as PIXI from 'pixi.js';

import 'pixi-sound';
import { Application } from 'pixi.js';
import * as WebFont from 'webfontloader';
import * as collisions from './lib/collisionDetection';
import { KeyListener } from './lib/keyListener';
import './main.css';
import { Ball } from './sprites/ball';
import { CenterLine } from './sprites/centerLine';
import { Paddle } from './sprites/paddle';

import './assets/images/loading.gif';

import './assets/sounds/beeep.ogg';
import './assets/sounds/peeeeeep.ogg';
import './assets/sounds/plop.ogg';

const sideHitSound = PIXI.sound.Sound.from('./assets/sounds/plop.ogg');
const paddleHitSound = PIXI.sound.Sound.from('./assets/sounds/beeep.ogg');
const scoreSound = PIXI.sound.Sound.from('./assets/sounds/peeeeeep.ogg');

let app: Application;
let state: ((delta: number) => void);
let ball = new Ball();
const leftPaddle = new Paddle(100);
const rightPaddle = new Paddle(window.innerWidth - 100);
let currentPaddle = rightPaddle;

const playerOneKeyboardUp = new KeyListener(87); // W key
const playerOneKeyboardDown = new KeyListener(83); // S key
const playerTwoKeyboardUp = new KeyListener(38); // Up arrow
const playerTwoKeyboardDown = new KeyListener(40); // Down arrow

let playerOneScore = 0;
const playerOneScoreText = new PIXI.Text('0', {fontFamily : 'Press Start 2P', fontSize: 72, fill : 0xffffff, align : 'center'});
playerOneScoreText.anchor.set(0.5, 0.5);
playerOneScoreText.position.set(window.innerWidth / 4, 100);

let playerTwoScore = 0;
const playerTwoScoreText = new PIXI.Text('0', {fontFamily : 'Press Start 2P', fontSize: 72, fill : 0xffffff, align : 'center'});
playerTwoScoreText.anchor.set(0.5, 0.5);
playerTwoScoreText.position.set((window.innerWidth / 4) * 3, 100);

let direction: boolean = true;

window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    // Remove all the old child elements
    while (app.stage.children[0]) {
        app.stage.removeChild(app.stage.children[0]);
    }
    addGraphicsToApp(app);
});

window.addEventListener('load', () => {
    bootstrap();
    WebFont.load({
        google: {
            families: ['Press Start 2P']
        },
        active: menu
    });
}, false);

function createPixiApp(): PIXI.Application {
    return new PIXI.Application({ width: window.innerWidth, height: window.innerHeight });
}

function addGraphicsToApp(appToUpdate: PIXI.Application): void {
    appToUpdate.stage.addChild(leftPaddle.sprite);
    appToUpdate.stage.addChild(rightPaddle.sprite);

    const centerLines = new CenterLine();
    centerLines.sprites.forEach((line: PIXI.Graphics) => {
        appToUpdate.stage.addChild(line);
    });

    appToUpdate.stage.addChild(ball.sprite);

    app.stage.addChild(playerOneScoreText);
    app.stage.addChild(playerTwoScoreText);
}

function bootstrap(): void {
    app = createPixiApp();
    const view = app.view;

    document.body.appendChild(view);
}

function gameLoop(delta: number): void {
    state(delta);
}

function score (delta: number): void {
    // You can still move while the score animation plays
    detectMovement();
}

function win (): void {
    const winningPlayer = (playerOneScore === 10) ? 'ONE' : 'TWO';
    const winText = new PIXI.Text(`PLAYER ${winningPlayer} WINS!`, {fontFamily : 'Press Start 2P', fontSize: 52, fill : 0xffffff, align : 'center'});
    winText.anchor.set(0.5, 0.5);
    winText.position.set(window.innerWidth / 2, window.innerHeight / 2);
    app.stage.addChild(winText);
}

function startPlaying(settings: IGameSettings): void {
    state = play;
    addGraphicsToApp(app);
    const element = document.getElementById('loadingContainer');
    element.classList.add('hidden');

    app.ticker.add((delta) => gameLoop(delta));
}

function menu(): void {
    const element = document.getElementById('loadingContainer');
    element.classList.add('hidden');

    const menuTitle = new PIXI.Text(`PONG`, {fontFamily : 'Press Start 2P', fontSize: 52, fill : 0xffffff, align : 'center'});
    const onePlayerText = new PIXI.Text(`1 PLAYER`, {fontFamily : 'Press Start 2P', fontSize: 52, fill : 0xffffff, align : 'center'});
    const twoPlayerText = new PIXI.Text(`2 PLAYER`, {fontFamily : 'Press Start 2P', fontSize: 52, fill : 0xffffff, align : 'center'});
    const menuContainer = new PIXI.Container();
    menuContainer.height = window.innerHeight;
    menuContainer.width = window.innerWidth;
    onePlayerText.interactive = true;
    onePlayerText.buttonMode = true;
    twoPlayerText.interactive = true;
    twoPlayerText.buttonMode = true;
    twoPlayerText.on('click', (event: Event) => {
        app.stage.removeChild(menuContainer);
        startPlaying({mode: 'twoPlayer'});
     });
    menuTitle.anchor.set(0.5, 0.5);
    onePlayerText.anchor.set(0.5, 0.5);
    twoPlayerText.anchor.set(0.5, 0.5);
    menuTitle.position.set(window.innerWidth / 2, window.innerHeight / 4);
    onePlayerText.position.set(window.innerWidth / 2, window.innerHeight / 2);
    twoPlayerText.position.set(window.innerWidth / 2, window.innerHeight / 1.5);
    menuContainer.addChild(menuTitle);
    menuContainer.addChild(onePlayerText);
    menuContainer.addChild(twoPlayerText);
    app.stage.addChild(menuContainer);
}

function play (delta: number): void {
    ball.calculateRebound(direction);
    detectMovement();
    // Find the center points of each sprite
    const paddleCenterX = currentPaddle.sprite.x + currentPaddle.sprite.width / 2;
    const paddleCenterY = currentPaddle.sprite.y + currentPaddle.sprite.height / 2;
    const ballCenterX = ball.sprite.x + ball.sprite.width / 2;
    const ballCenterY = ball.sprite.y + ball.sprite.height / 2;

    // Calculate the distance vector between the sprites
    const vx = paddleCenterX - ballCenterX;
    const vy = paddleCenterY - ballCenterY;

    // PERF: It should be easy to work out if a ball is near either a paddle, side or goal without testing all three
    if (collisions.paddle(currentPaddle, ball, vx, vy)) {
        paddleHitSound.play();

        // Set the ball return angle
        // PERF: This is a really dumb way to do this...
        switch (true) {
            case vy > 60:
                ball.setAngle(direction ? 40 : 140);
                break;

            case vy > 40:
                ball.setAngle(direction ? 60 : 120);
                break;

            case vy > 20:
                ball.setAngle(direction ? 80 : 100);
                break;

            case vy < 20 && vy > -20:
                ball.setAngle(90);
                break;

            case vy < -20:
                ball.setAngle(direction ? 100 : 80);
                break;

            case vy < -40:
                ball.setAngle(direction ? 120 : 60);
                break;

            case vy < -60:
                ball.setAngle(direction ? 140 : 40);
                break;

            default:
                ball.setAngle(90);
                break;
        }

        if (!direction && (playerOneKeyboardDown.isDown || playerOneKeyboardUp.isDown)){
            ball.speedUp();
        } else if (direction && (playerTwoKeyboardDown.isDown || playerTwoKeyboardUp.isDown)){
            ball.speedUp();
        } else {
            ball.slowDown();
        }

        direction = !direction;
        currentPaddle = direction ? rightPaddle : leftPaddle;

        return;
    }

    if (collisions.side(ball)) {
        sideHitSound.play();
        ball.invertAngle();
        return;
    }

    if (collisions.goal(ball)) {
        scoreSound.play();
        if (direction) {
            playerOneScore++;
            playerOneScoreText.text = playerOneScore.toString();
        } else {
            playerTwoScore++;
            playerTwoScoreText.text = playerTwoScore.toString();
        }

        if (playerOneScore === 10 || playerTwoScore === 10) {
            state = win;
            return;
        }

        state = score;

        const flashing = setInterval(() => {
            ball.sprite.alpha = ball.sprite.alpha ? 0 : 1;
        }, 200);

        setTimeout(() => {
            clearInterval(flashing);
            app.stage.removeChild(ball.sprite);
            ball = new Ball();
            app.stage.addChild(ball.sprite);
            state = play;
            app.ticker.start();
        }, 3000);
        return;
    }
}

function detectMovement(): void {
    if (playerOneKeyboardUp.isDown && leftPaddle.sprite.y > 0) {
        leftPaddle.moveUp();
    }

    if (playerOneKeyboardDown.isDown && (leftPaddle.sprite.y + leftPaddle.sprite.height) < window.innerHeight) {
        leftPaddle.moveDown();
    }

    if (playerTwoKeyboardUp.isDown && rightPaddle.sprite.y > 0) {
        rightPaddle.moveUp();
    }

    if (playerTwoKeyboardDown.isDown && (rightPaddle.sprite.y + rightPaddle.sprite.height) < window.innerHeight) {
        rightPaddle.moveDown();
    }
}

interface IGameSettings {
    mode: 'onePlayer' | 'twoPlayer';
}
