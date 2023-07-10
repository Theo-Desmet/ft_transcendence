import { Injectable, flatten } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Ball, Mode, Room, State } from './interface/room.interface';
import { Player, Racket } from './interface/player.interface';

@Injectable()
export class PongGame {
	private lastRoomId = 0;
	private roomsMap: Map<Mode, Room[]> = new Map();
	private disconnectedUsers: Map<number, string> = new Map();

	async extractRoom(rooms: Room[]){
		const filteredRooms = rooms.map(room => {
			const { players, ...rest } = room;
			const filteredPlayers = players.map(({ socket, ...player }) => player);
			return { ...rest, players: filteredPlayers };
		  });
		return filteredRooms;
	}

	async hasDisconnect(email: string): Promise<Object> {
		let roomId: number = -1;
		for (let [key, value] of this.disconnectedUsers.entries()) {
			if (value === email){
				roomId = key;
				break;
			}
		}
		return ({status: roomId !== -1, roomId: roomId});
	}

	async getRooms(){
		let res = [];
		const keysArray = Array.from(this.roomsMap.keys());
		for (var key of keysArray){
			res.push(await this.extractRoom(this.roomsMap.get(key)));
		}
		return (res);
	}

	async getRoomById(id: number){
		for (let [key, value] of this.roomsMap) {
			const res = value.find(room => room.id === id);
			if (res)
				return (res);
		}
	}

	async createRoom(mode: Mode): Promise<Room> {
		const room: Room = {
			id: this.lastRoomId++,
			state: State.QUEUE,
			mode: mode,
			players: [],
			ball: null,
			time: 0,
			canvas: {width: 2000, height: 1200}
		};
		this.roomsMap.get(mode).push(room);
		return room;
	}

	async joinRoom(client: Socket, room: Room, player: Player): Promise<Room> {
		if (room.players.length < 2) {
			room.players.push(player);
			if (room.players.length === 2) {
				if (room.state === State.QUEUE)
					room.state = State.INIT;
				player.roomId = room.id;
				client.data.room = room;
			}
			return (room);
		} else {
			// Gérer le cas où la salle est pleine
		}
	}

	async isSocketInsideRoom(room: Room, socketId: string): Promise<Boolean>{
		const playerNames: string[] = room.players.map((player) => player.socket.id);
		return (playerNames.includes(socketId));
	}

	async isEmailInGame(email: string){//: Promise<Room | null>{
		const keysArray = Array.from(this.roomsMap.keys());
		for (var key of keysArray){
			for (var room of this.roomsMap.get(key)){
				if (this.isEmailInsideRoom(room, email))
					return (true);
			}
		}
		return (false);
	}

	async isPlayerInsideRoom(room: Room, player: Player): Promise<Boolean>{
		const playerNames: string[] = room.players.map((player) => player.user.email);
		return (playerNames.includes(player.user.email));
	}

	async isEmailInsideRoom(room: Room, email: string): Promise<Boolean>{
		const playerNames: string[] = room.players.map((player) => player.user.email);
		return (playerNames.includes(email));
	}

	async searchRoom(client: Socket, player: Player, mode: Mode): Promise<Room> {
		if (this.roomsMap.get(mode)){
			for (var room of this.roomsMap.get(mode) as Room[]){
				if ((room.id === player.roomId || room.state === State.QUEUE) && !await this.isPlayerInsideRoom(room, player)){
					console.log("trouver");
					if (this.disconnectedUsers.get(room.id))
						this.disconnectedUsers.delete(room.id);
					return (this.joinRoom(client, room, player));
				}
			}
		}
		else {
			this.roomsMap.set(mode, []);
		}
		console.log("pas trouver");
		const newRoom: Room = await this.createRoom(mode);
		player.roomId = newRoom.id;
		return (this.joinRoom(client, newRoom, player));
	}

	async resetBall(room: Room) {
		room.ball.radius = 20
		room.ball.position.x = 1000;
		room.ball.position.y = 600;
		room.ball.direction.x = (Math.random() * 2 - 1);
		(room.ball.direction.x % 0.5 == 0) ? room.ball.direction.x * 4 : 1;
		(room.ball.direction.x > 1.1) ? room.ball.direction.x / 2 : 1;
		room.ball.direction.y = (Math.random() * 2 - 1) / 2;
		room.ball.speed = 5;
	}

	async resetRacket(room: Room) {
		if (room.players[0]){
			room.players[0].racket.top_pos.x = 100;
			room.players[0].racket.top_pos.y = 500;
			room.players[0].racket.bot_pos.x = 100;
			room.players[0].racket.bot_pos.y = 700;
			room.players[0].racket.size = 200;
			room.players[0].racket.width = 50;
		}
		if (room.players[1]){
			room.players[1].racket.top_pos.x = 1900;
			room.players[1].racket.top_pos.y = 500;
			room.players[1].racket.bot_pos.x = 1900;
			room.players[1].racket.bot_pos.y = 700;
			room.players[1].racket.size = 200;
			room.players[1].racket.width = 50;
		}
	}

	async updateRacket(client: Socket, room: Room, key: any) {
		if (client === room.players[0].socket) {
			if (key === "arrowUp") {
				if (room.players[0].racket.top_pos.y > 10)
				room.players[0].racket.top_pos.y -= 10;
				room.players[0].racket.bot_pos.y -= 10;
			}
			else if (key === "arrowDown") {
				if (room.players[0].racket.top_pos.y < 990)
				room.players[0].racket.top_pos.y += 10;
				room.players[0].racket.bot_pos.y += 10;
			}
		} else if (client === room.players[1].socket) {
			if (key === "arrowUp") {
				if (room.players[1].racket.top_pos.y > 10)
				room.players[1].racket.top_pos.y -= 10;
				room.players[1].racket.bot_pos.y -= 10;
			}
			else if (key === "arrowDown") {
				if (room.players[1].racket.top_pos.y < 990)
				room.players[1].racket.top_pos.y += 10;
				room.players[1].racket.bot_pos.y += 10;
			}
		}
	}

	updateBall(client:Socket,  room: Room) {
		const next = {
			x: room.ball.direction.x * room.ball.speed + room.ball.radius,
			y: room.ball.direction.x * room.ball.speed + room.ball.radius,
		}

		if (room.ball.position.x + next.x > room.canvas.width) {
			room.players[0].score++;
			if (room.players[0].score == 7) {
				;//fonction fin de partie
			}
			client.emit("updateScore", room.players[0].score, room.players[1].score)
			this.resetBall(room);
		}

		if (room.ball.position.x + next.x < room.ball.radius) {
			room.players[1].score++;
			if (room.players[1].score == 7) {
				;//fonction fin de partie
			}
			this.resetBall(room);
		}

		if (room.ball.position.y + next.y > room.canvas.height
				|| room.ball.position.y + next.y < room.ball.radius) {
			room.ball.direction.y *= -1;
		}

		if (room.ball.position.x + next.x <= room.players[0].racket.top_pos.x
				+ room.players[0].racket.width && room.ball.position.y + next.y 
				<= room.players[0].racket.bot_pos.y && room.ball.position.y + next.y
				>= room.players[0].racket.top_pos.y)
		{
			room.ball.direction.x *= -1;
			room.ball.direction.y = (Math.random() * 2 - 1) / 2
			room.ball.speed++;
		}

		if (room.ball.position.x + next.x >= room.players[1].racket.top_pos.x
			+ room.players[1].racket.width && room.ball.position.y + next.y 
			<= room.players[1].racket.bot_pos.y && room.ball.position.y + next.y 
			>= room.players[1].racket.top_pos.y)
		{
			room.ball.direction.x *= -1;
			room.ball.direction.y = (Math.random() * 2 - 1) / 2
			room.ball.speed++;
		}


		room.ball.position.x += room.ball.direction.x * room.ball.speed;
		room.ball.position.y += room.ball.direction.y * room.ball.speed;
	}

	updateGame(client: Socket, room: Room, key: any) {
		this.updateBall(client, room);
		this.updateRacket(client, room, key);
		client.emit("updateGame", room.ball, room.players[0].racket, room.players[1].racket);
	}



	async initGame(room: Room) {
		if (!room.ball){
			room.ball = new Ball();
			await this.resetBall(room);
		}

		if (!room.players[0].racket)
			room.players[0].racket = new Racket()

		if (room.players[1]){
			if (!room.players[1].racket)
				room.players[1].racket = new Racket()
		}

		if (room.players[1] && room.players[1].racket)
			await this.resetRacket(room);
		room.canvas.width = 2000;
		room.canvas.height = 1200;
	}

	async playGame(client: Socket, room: Room) {
		await this.initGame(room);
		var key: any;
		client.on('arrowUpdate', (data) => {
			key = data;
		});
		client.data.gameInterval = setInterval(() => {
			if (client.disconnected){
				clearInterval(client.data.gameInterval);
				return;
			}
			switch (room.state) {
				case State.QUEUE:
					client.emit('text', "QUEUEING");
					break;
				case State.INIT:{
					if (room.players.length === 2)
						room.state = State.COOLDOWN;
					break;
				}

				case State.COOLDOWN:
					// Handle cooldown
					room.state = State.PLAY;
					break;

				case State.PLAY:
					this.updateGame(client, room, key);
					break;
				
				default:
					break;
			}
		}, 20);
	}

	async leaveRoomSocket(socketId: string, client: Socket){
		const keysArray = Array.from(this.roomsMap.keys());
		for (var key of keysArray as Mode[]){
			for (var room of this.roomsMap.get(key) as Room[]){
				if (! await this.isSocketInsideRoom(room, socketId))
					continue;
				if (room.players.length === 2){
					room.players = room.players.filter((element) => element.socket.id !== socketId);
					room.state = State.WAITING;
					this.disconnectedUsers.set(room.id, client.data.user.email);
					console.log(this.disconnectedUsers);
				}
				else if (room.players.length === 1){
					room.state = State.FINAL;
				}
			}
		}
	}

	async checkDisconnection(client: Socket, room: Room){
		let countDown: number = 0;
		const it = setInterval(() => {
			if (room.state === State.WAITING){
				client.emit('text', "WAITING");
				countDown++;
				if (room.players.length == 2){
					room.state = State.INIT;
					countDown = 0;
				}
				// if (countDown === 10){
				// 	room.state = State.FINAL;
				// }
			}
			if (room.state === State.FINAL){
				countDown = 0;
				this.disconnectedUsers.delete(room.id);
				this.roomsMap.set(room.mode, this.roomsMap.get(room.mode).filter((el) => el !== room));
				client.emit('text', "FINISHED");
				clearInterval(client.data.gameInterval);
				clearInterval(it);
			}
			if (room.state === State.PLAY){
				countDown = 0;
			}
		}, 500);
	}
}