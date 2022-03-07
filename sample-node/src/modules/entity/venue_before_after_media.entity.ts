import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  OneToOne
} from 'typeorm';
import { Venues } from './venues.entity';
import { VenueContentMarkers } from "./venue_content_markers.entity";
import { MediaGallery } from "./media_gallery.entity";

@Entity('venue_before_after_media')
export class VenueBeforeAfterMedia {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  venue_marker_id: number;

  @Column()
  before_image_id: number;

  @Column()
  after_image_id: number;

  @CreateDateColumn()
  public created_at: Date;

  @UpdateDateColumn()
  public updated_at: Date;

  @ManyToOne(type => VenueContentMarkers, venueContentMarkers => venueContentMarkers.venueMarkerMedia)
  @JoinColumn({ name: "venue_marker_id" })
  venueContentMarkers: VenueContentMarkers;

  @OneToOne(type => MediaGallery, mediaGallery => mediaGallery.venueBeforeMedia)
  @JoinColumn({ name: "before_image_id" })
  mediaBeforeGallery: MediaGallery;

  @OneToOne(type => MediaGallery, mediaGallery => mediaGallery.venueAfterMedia)
  @JoinColumn({ name: "after_image_id" })
  mediaAfterGallery: MediaGallery;

}
