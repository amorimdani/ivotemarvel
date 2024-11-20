// vote.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { Characters } from './character.entity';

@Entity()
export class Vote {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Characters)
  @JoinColumn({ name: 'voterId' })
  voter: Characters; // Personagem que está votando

  @ManyToOne(() => Characters)
  @JoinColumn({ name: 'votedId' })
  voted: Characters; // Personagem que está sendo votado

  @Column()
  value: number; // 1 estrela para votação
}
