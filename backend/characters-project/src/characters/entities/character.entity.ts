import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn  } from "typeorm";

@Entity ('Characters')
export class Characters {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;
  
    @Column()
    description: string;
  
    @Column({ nullable: true })
    thumbnailUrl: string;

    @Column({ default: 3 })
    stars: number;
  
    @UpdateDateColumn()
    lastVoteDate: Date;
  
}