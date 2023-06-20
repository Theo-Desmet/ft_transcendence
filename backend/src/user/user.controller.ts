import { Body, Controller, Get, Param, Post, Req, Res, UseGuards,} from '@nestjs/common';
import { Response, Request } from 'express';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('user')
export class UserController {
	constructor(private readonly userService: UserService) {}


	//TODO SEND PARTIAL USER TO NOT SEND CRITICAL VALUES

	@Get()
	getUsers(){
		return (this.userService.getAllUsers());
	}
	
	@Get('/me')
	@UseGuards(JwtAuthGuard)
	me(@Req() req: Request){
		const id = req["user"]["user"]["id"];
		return (this.userService.getById(id));
	}
	
	@Get(":name")
	getUserByName(@Param('name') name: string){
		return (this.userService.getByName(name));
	}
	
	@Post('/setname')
	@UseGuards(JwtAuthGuard)
	async setUsername(@Req() req, @Body() body, @Res() res: Response){
		if (! await this.userService.updateUsername(req["user"]["user"]["email"], body["username"]))
			res.statusCode = 403;
		else
			res.statusCode = 201;
		res.send();
	}
	
	@Get("/id/:id")
	getUserById(@Param('id') id: number){
		return (this.userService.getById(id));
	}
	
}
