import { Entity, PrimaryGeneratedColumn, JoinColumn, Column, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, OneToMany } from "typeorm";
import { Venues } from "./venues.entity";
import { PoiDetails } from "./poi_details.entity";
import { Tours } from "./tours.entity";
import { MediaGallery } from "./media_gallery.entity";
import { StopVenue } from "./stop_venues.entity";
import { StopPois } from "./stop_pois.entity";
import { NearByStop } from "./near_by_stop.entity";
import { TourStops } from "./tour_stops.entity";
import { StopContentMarkers } from "./stop_content_marker.entity";

@Entity('stops')
export class Stop {
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
  description: string;

  @Column()
  slug: string;

  @Column()
  url: string;

  @Column()
  latitude: string;

  @Column()
  longitude: string;

  @Column()
  zoom_level: string;

  @Column()
  panorama_image_id: number;

  @Column()
  street_photo_id: number;

  @Column()
  render_data_id: number;

  @Column()
  wrap_video_id: number;

  @Column()
  yaw: string;

  @Column()
  pitch: string;

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

  @OneToMany(
    type => StopContentMarkers,
    stopContentMarkers => stopContentMarkers.stops,
  )
  @JoinColumn({ name: 'stop_id' })
  stopContentMarkers: StopContentMarkers[];

  @ManyToMany(type => Tours, { eager: true })
  @JoinTable({
    name: 'tour_stops',
    joinColumns: [
      { name: 'stop_id' }
    ],
    inverseJoinColumns: [
      { name: 'tour_id' }
    ]
  })
  tours: Tours[];

  @ManyToMany(type => Venues, { eager: true })
  @JoinTable({
    name: 'stop_venues',
    joinColumns: [
      { name: 'stop_id' }
    ],
    inverseJoinColumns: [
      { name: 'venue_id' }
    ]
  })
  venues: Venues[];

  /*@ManyToMany(type => PoiDetails, { eager: true })
   @JoinTable({
      name: 'stop_pois',
      joinColumns: [
        { name: 'stop_id' }
      ],
      inverseJoinColumns: [
        { name: 'poi_id' }
      ]
    })
  poiDetails: PoiDetails[];*/

  @ManyToOne(type => MediaGallery, mediaGallery => mediaGallery.panorama)
  @JoinColumn({ name: "panorama_image_id" })
  panorama: MediaGallery;

  @ManyToOne(type => MediaGallery, mediaGallery => mediaGallery.streetPhoto)
  @JoinColumn({ name: "street_photo_id" })
  streetPhoto: MediaGallery;

  @OneToMany(type => StopVenue, stopVenue => stopVenue.stop)
  stopVenue: StopVenue[];

  @OneToMany(type => TourStops, tourStops => tourStops.stop)
  tourStops: TourStops[];


  @OneToMany(type => StopPois, stopPois => stopPois.stop)
  @JoinColumn({ name: "stop_id" })
  stopPois: StopPois[];

  @OneToMany(type => NearByStop, nearByStop => nearByStop.stop)
  @JoinColumn({ name: "stop_id" })
  nearByStop: NearByStop[];

  @OneToMany(type => NearByStop, nearByStop => nearByStop.stopDetail)
  nearByStopDetail: NearByStop[];
}
