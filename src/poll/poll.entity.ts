import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Poll {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  gameId: string;

  @Column()
  followersCount: string;

  @Column('jsonb', { nullable: true })
  followersList: string[];

  @Column('jsonb', { nullable: true })
  newList: string[];

  @Column('jsonb', { nullable: true })
  removedList: string[];
}
