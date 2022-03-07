import {
  Entity,
  PrimaryGeneratedColumn,
  JoinColumn,
  Column,
  ManyToMany,
  OneToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
} from 'typeorm';
import { MediaGallery } from './media_gallery.entity';
import { Stop } from './stops.entity';
import { TourCategory } from './tour_category.entity';
import { VenueContentMarkers } from './venue_content_markers.entity';
import { VenueBeforeAfterMedia } from './venue_before_after_media.entity';
import { StopVenue } from './stop_venues.entity';
import { VenuePoi } from './venue_poi.entity';
import { NearByVenue } from './near_by_venues.entity';

@Entity('venues')
export class Venues {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;


  @Column()
  assigned_user: number;

  @Column()
  user_permission: number;

  @Column()
  name: string;

  @Column()
  unique_name: string;

  @Column()
  url: string;

  @Column()
  street_address: string;

  @Column()
  phone: string;

  @Column()
  header_1: String;

  @Column()
  header_2: String;

  @Column()
  header_3: String;

  @Column()
  header_4: String;

  @Column()
  header_5: String;

  @Column()
  text_1: String;

  @Column()
  text_2: String;

  @Column()
  text_3: String;

  @Column()
  text_4: String;

  @Column()
  text_5: String;

  @Column()
  slug: string;

  // @Column()
  // description: string;

  @Column()
  latitude: string;

  @Column()
  longitude: string;

  @Column()
  panorama_image_id: number;

  @Column()
  street_photo_id: number;

  @Column()
  zoom_level : string;

  // @Column()
  // arial_photo_id: number;

  // @Column()
  // wrap_video_id: number;

  @Column()
  yaw: string;

  @Column()
  pitch: string;

  @Column()
  status: string;

  @Column()
  inactive_reason: string;

  @Column()
  fov: string;

  @Column()
  roll: string;

  @Column()
  meta_title: string;

  @Column()
  meta_desc: string;

  @Column()
  xmlfile_path: string;

  @CreateDateColumn()
  public created_at: Date;

  @UpdateDateColumn()
  public updated_at: Date;

  @DeleteDateColumn()
  public deleted_at: Date;

  @ManyToOne(
    type => MediaGallery,
    mediaGallery => mediaGallery.panorama,
  )
  @JoinColumn({ name: 'panorama_image_id' })
  panorama: MediaGallery;

  @ManyToOne(
    type => MediaGallery,
    mediaGallery => mediaGallery.streetPhoto,
  )
  @JoinColumn({ name: 'street_photo_id' })
  streetPhoto: MediaGallery;

  @ManyToOne(
    type => MediaGallery,
    mediaGallery => mediaGallery.arialPhoto,
  )
  @JoinColumn({ name: 'arial_photo_id' })
  arialPhoto: MediaGallery;

  @ManyToOne(
    type => MediaGallery,
    mediaGallery => mediaGallery.wrapVideo,
  )
  @JoinColumn({ name: 'wrap_video_id' })
  wrapVideo: MediaGallery;

  @OneToMany(
    type => VenueContentMarkers,
    venueContentMarkers => venueContentMarkers.venues,
  )
  @JoinColumn({ name: 'venue_id' })
  venueContentMarkers: VenueContentMarkers[];

  @ManyToMany(type => Stop, { eager: true })
  @JoinTable({
    name: 'stop_venues',
    joinColumns: [{ name: 'venue_id' }],
    inverseJoinColumns: [{ name: 'stop_id' }],
  })
  stop: Stop[];

  @ManyToMany(type => TourCategory, { eager: true })
  @JoinTable({
    name: 'venue_tour_categories',
    joinColumns: [{ name: 'venue_id' }],
    inverseJoinColumns: [{ name: 'category_id' }],
  })
  tourCategory: TourCategory[];

  @OneToMany(
    type => StopVenue,
    stopVenue => stopVenue.venues,
  )
  @JoinColumn({ name: 'venue_id' })
  stopVenue: StopVenue[];

  @OneToMany(
    type => VenuePoi,
    venuePoi => venuePoi.venues,
  )
  @JoinColumn({ name: 'venue_id' })
  venuePoi: VenuePoi[];

  @OneToMany(
    type => NearByVenue,
    nearByVenue => nearByVenue.venue,
  )
  @JoinColumn({ name: 'venue_id' })
  nearByVenue: NearByVenue[];

  @OneToMany(
    type => NearByVenue,
    nearByStop => nearByStop.venueDetail,
  )
  nearByVenueDetail: NearByVenue[];
}
