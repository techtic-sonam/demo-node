import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { MediaGallery } from './media_gallery.entity';
import { Stop } from './stops.entity';
import { Venues } from './venues.entity';

@Entity('stop_venues')
export class StopVenue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  stop_id: number;

  @Column()
  venue_id: number;

  @Column()
  venue_hotspot_name: string;

  @Column()
  yaw: string;

  @Column()
  pitch: string;

  @Column()
  order: number;

  @Column()
  position: string;

  @CreateDateColumn()
  public created_at: Date;

  @UpdateDateColumn()
  public updated_at: Date;

  @ManyToOne(
    type => Venues,
    venues => venues.stopVenue,
  )
  @JoinColumn({ name: 'venue_id' })
  venues: Venues;

  @ManyToOne(
    type => Stop,
    stop => stop.stopVenue,
  )
  @JoinColumn({ name: 'stop_id' })
  stop: Stop;
}
