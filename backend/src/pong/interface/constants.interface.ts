export abstract class PongConstants {
	static readonly RACKET_WIDTH: number = 30;
	static readonly RACKET_HEIGHT: number = 2000;
	static readonly MIN_BALL_SPEED: number = 6;
	static readonly MAX_BALL_SPEED: number = 12;
	static readonly WIN_SCORE_VALUE: number = 512;

	static readonly CANVAS_WIDTH: number = 1200;
	static readonly CANVAS_HEIGHT: number = 600;

	static readonly GAME_DURATION: number = 60; //seconds
	static readonly GAME_TICK: number = 10;

	static readonly BIG_PAD_VALUE: number = 30;
	static readonly LIL_PAD_VALUE: number = 30;

	static readonly SPEED_BALL_POWERUP: number = 15;

	static readonly BIG_PADDLE_DURATION: number = 15000; //miliseconds
	static readonly LIL_PADDLE_DURATION: number = 7000; //miliseconds
	static readonly SPEEDY_BALL_DURATION: number = 15000;//miliseconds

};