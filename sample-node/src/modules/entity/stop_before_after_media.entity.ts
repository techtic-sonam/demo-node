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
import { StopContentMarkers } from './stop_content_marker.entity';
  
  @Entity('stop_before_after_media')
  export class StopBeforeAfterMedia {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    stop_marker_id: number;
  
    @Column()
    before_image_id: number;
  
    @Column()
    after_image_id: number;
  
    @CreateDateColumn()
    public created_at: Date;
  
    @UpdateDateColumn()
    public updated_at: Date;
  
    @ManyToOne(type => StopContentMarkers, stopContentMarkers => stopContentMarkers.stopMarkerMedia)
    @JoinColumn({ name: "stop_marker_id" })
    stopContentMarkers: StopContentMarkers;
  
    @OneToOne(type => MediaGallery, mediaGallery => mediaGallery.stopBeforeMedia)
    @JoinColumn({ name: "before_image_id" })
    mediaBeforeGallery: MediaGallery;
  
    @OneToOne(type => MediaGallery, mediaGallery => mediaGallery.stopAfterMedia)
    @JoinColumn({ name: "after_image_id" })
    mediaAfterGallery: MediaGallery;
  
  }
  