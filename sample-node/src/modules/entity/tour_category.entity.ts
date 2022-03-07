import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MediaGallery } from './media_gallery.entity';
import { PoiDetails } from './poi_details.entity';

@Entity('tour_categories')
export class TourCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: number;

  @Column()
  logo: string;

  @CreateDateColumn()
  public created_at: Date;

  @UpdateDateColumn()
  public updated_at: Date;
}
