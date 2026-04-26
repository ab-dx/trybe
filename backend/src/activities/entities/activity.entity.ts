import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	JoinColumn,
	CreateDateColumn,
	OneToMany,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Rsvp } from "../../rsvp/entities/rsvp.entity";
import { Message } from "../../chat/entities/message.entity";
import { ActivityHype } from "../../activity-hype/entities/activity-hype.entity";
type Point = {
	type: "Point";
	coordinates: [number, number];
};

export enum ActivityStatus {
	DRAFT = "DRAFT",
	UPCOMING = "UPCOMING",
	LIVE = "LIVE",
	COMPLETED = "COMPLETED",
	CANCELLED = "CANCELLED",
}

export enum Visibility {
	PUBLIC = "PUBLIC",
	FRIENDS = "FRIENDS",
	PRIVATE = "PRIVATE",
}

@Entity("activities")
export class Activity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column("uuid", { name: "hostId" })
	hostId: string;

	@ManyToOne(
		() => User,
		(user: User) => user.hostedActivities,
	)
	@JoinColumn({ name: "hostId" })
	host: User;

	@Column()
	title: string;

	@Column({ nullable: true })
	description: string;

	@Column({ type: "geometry", spatialFeatureType: "Point", srid: 4326 })
	location: Point;

	@Column({ nullable: true })
	geohash: string;

	@Column()
	startTime: Date;

	@Column({ nullable: true })
	endTime: Date;

	@Column({ type: "enum", enum: ActivityStatus, default: ActivityStatus.DRAFT })
	status: ActivityStatus;

	@Column({ type: "enum", enum: Visibility, default: Visibility.PUBLIC })
	visibility: Visibility;

	@CreateDateColumn()
	createdAt: Date;

	@OneToMany(
		() => Rsvp,
		(rsvp) => rsvp.activity,
	)
	rsvps: Rsvp[];

	@OneToMany(
		() => ActivityHype,
		(hype) => hype.activity,
	)
	hypes: ActivityHype[];

	@OneToMany(
		() => Message,
		(message) => message.activity,
	)
	messages: Message[];
}
