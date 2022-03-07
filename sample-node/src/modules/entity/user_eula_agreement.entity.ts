import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  OneToOne,
} from 'typeorm';
import { EulaAgreement } from './eula_agreement.entity';
import { User } from './user.entity';

@Entity('user_eula_agreement')
export class UserEulaAgreement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  eula_id: number;

  @Column()
  eula_agreed_at: Date;

  @CreateDateColumn()
  public created_at: Date;

  @UpdateDateColumn()
  public updated_at: Date;

  @UpdateDateColumn()
  public deleted_at: Date;

  @ManyToOne(
    type => User,
    userEula => userEula.user,
  )
  @JoinColumn({ name: 'user_id' })
  eulaInfo: User;


  @OneToOne(
    type => EulaAgreement,
    eulaUserDetails => eulaUserDetails.id,
  )
  @JoinColumn({ name: 'eula_id' })
  eulaDetails: EulaAgreement;
}
