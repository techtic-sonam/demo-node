import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  AfterLoad,
  OneToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
  OneToMany,
  DeleteDateColumn,
  ManyToOne,
} from 'typeorm';
import { PasswordTransformer } from 'src/shared/password.transformer';
import { Exclude } from 'class-transformer';
import { baseUrl } from 'src/shared/helpers/utill';
import { UserHasRole } from './userHasRole.entity';
import { Role } from './role.entity';
import { IsBoolean } from 'class-validator';
import { Country } from './country.entity';
import { State } from './state.entity';
import { MediaGallery } from './media_gallery.entity';
import { Tours } from './tours.entity';
import { UserEulaAgreement } from './user_eula_agreement.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  company_name: string;

  @Column()
  mobile_number: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column()
  status: string;

  @Column()
  email: string;

  @Column()
  profile_pic: string;

  @Exclude()
  @Column({
    select: false,
    name: 'password',
    length: 255,
    transformer: new PasswordTransformer(),
  })
  password: string;

  @Column()
  contact_address: string;

  @Column()
  contact_city: string;

  @Column()
  contact_state: string;

  @Column()
  contact_country: string;

  @Column()
  contact_zip: string;

  @Column()
  billing_address: string;

  @Column()
  billing_city: string;

  @Column()
  billing_state: string;

  @Column()
  billing_country: string;

  @Column()
  billing_zip: string;

  @Column()
  tax_identification_number: string;

  @Column()
  company_registration_number: string;

  @Column()
  verification_code: string;

  @Column()
  is_verified: boolean;

  @Column()
  contact_person_info: string;

  @Column()
  inactive_reason: string;

  @CreateDateColumn()
  public created_at: Date;

  @UpdateDateColumn()
  public updated_at: Date;

  @DeleteDateColumn()
  public deleted_at: Date;

  fullName: string;
  @AfterLoad()
  setComputed() {
    this.fullName = this.first_name + ' ' + this.last_name;
  }

  @ManyToMany(type => Role, { eager: true })
  @JoinTable({
    name: 'user_has_role',
    joinColumns: [{ name: 'user_id' }],
    inverseJoinColumns: [{ name: 'role_id' }],
  })
  roles: Role[];

  @OneToOne(type => Country)
  @JoinColumn({ name: 'billing_country' })
  billingCountry: Country;

  @OneToOne(type => State)
  @JoinColumn({ name: 'billing_state' })
  billingState: State;

  @OneToOne(type => Country)
  @JoinColumn({ name: 'contact_country' })
  contactCountry: Country;

  @OneToOne(type => State)
  @JoinColumn({ name: 'contact_state' })
  contactState: State;

  @OneToMany(
    type => MediaGallery,
    mediaGallery => mediaGallery.user,
  )
  media: MediaGallery[];

  @OneToMany(
    type => Tours,
    tours => tours.user,
  )
  user: Tours[];

  @OneToMany(
    type => UserEulaAgreement,
    userEula => userEula.eulaInfo,
  )
  eulaInfo: UserEulaAgreement[];
}
