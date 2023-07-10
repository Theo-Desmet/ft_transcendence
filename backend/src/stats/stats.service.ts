import { Injectable, Req } from '@nestjs/common';
import { StatsDetail } from './stats.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express'
import { Match } from 'src/match/match.entity';
import { User } from 'src/user/user.entity';

@Injectable()
export class StatsService {
	constructor(@InjectRepository(StatsDetail) private statsRepository: Repository<StatsDetail>) {}

	async getAllStats(){
		return this.statsRepository.find()
	}

	async getPersonnalStats(@Req() req: Request): Promise<StatsDetail>{
		const user = req["user"]["user"];
		return await this.statsRepository.findOne({
			where: {
				id: user["stats"]["id"]
			},
			loadRelationIds: true
		});
	}

	async getUserStats(statsId: number){
		return await this.statsRepository.findOne({
			where: {
				id: statsId
			},
			loadRelationIds: true
		});
	}

	async updateStats(match: Match, user: Partial<User>, indexPlayer: number){
		const stats: StatsDetail = await this.getUserStats(user.stats.id);
		const opId = (indexPlayer === 1 ? 2 : 1);
		stats.winPoints += match[`scorePlayer${indexPlayer}`];
		stats.loosePoints += match[`scorePlayer${opId}`];
		stats.highScore = (match[`scorePlayer${indexPlayer}`] > stats.highScore ? match[`scorePlayer${indexPlayer}`] : stats.highScore);
		const isClassic: boolean = match["mode"] === "classic";
		isClassic ? stats.totalClassicGames += 1 : stats.friendDuel += 1;
		stats.totalGames = stats.totalClassicGames + stats.friendDuel;
		if (match[`scorePlayer${indexPlayer}`] > match[`scorePlayer${opId}`])
			stats.wins += 1;
		else
			stats.looses += 1;
		stats.meanScore = stats.winPoints / stats.totalGames;
		user.stats = stats;
	}

	async getUpdatedMmr(score1: number, score2: number, mmr1: number, mmr2: number): Promise<number>{
		const expectedScore = 1 / (1 + 10 ** ((mmr2 - mmr1) / 400));
		const result = score1 > score2 ? 1 : (score1 < score2 ? 0 : 0.5);
		const ratingChange = 64 * (result - expectedScore);
		return (mmr1 + ratingChange);
	}
}
