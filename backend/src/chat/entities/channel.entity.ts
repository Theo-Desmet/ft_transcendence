import { User } from "src/user/user.entity";
import { Message } from "./message.entity";
import { Column, Entity, Generated, ManyToMany, OneToMany, PrimaryColumn } from "typeorm";

@Entity()
export class Channel {
	@PrimaryColumn()
	@Generated('increment')
	public id: number;

	@Column({ unique: true })
	public name: string;

	@ManyToMany(() => User, user => user.channels)
	users: User[];

	@OneToMany(() => Message, message => message.channel, {
		cascade: true,
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
	})
	public messages: Message[];
};