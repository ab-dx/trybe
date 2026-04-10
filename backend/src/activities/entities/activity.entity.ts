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
import { Point } from "geojson";

export class Rsvp {
	activityId: string;
	userId: string;
	checkedIn: boolean;
}

export class Message {
	activityId: string;
	id: string;
	content: string;
	senderId: string;
	createdAt: Date;
}

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
	INVITE_ONLY = "INVITE_ONLY",
}

@Entity("activities")
export class Activity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column("uuid")
	hostId: string;

	@ManyToOne(
		() => User,
		(user: User) => user.activities,
	)
	@JoinColumn({ name: "host_id" })
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

	rsvps: Rsvp[];
	messages: Message[];
}
