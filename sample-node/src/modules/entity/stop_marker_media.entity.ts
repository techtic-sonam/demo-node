import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";
import { Venues } from "./venues.entity";
import { VenueContentMarkers } from "./venue_content_markers.entity";
import { MediaGallery } from "./media_gallery.entity";
import { StopContentMarkers } from "./stop_content_marker.entity";

@Entity('stop_marker_media')
export class StopMarkerMedia {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    stop_marker_id: number;

    @Column()
    media_id: number;

    @Column()
    order: number;

    @CreateDateColumn()
    public created_at: Date;

    @UpdateDateColumn()
    public updated_at: Date;


    @ManyToOne(type => StopContentMarkers, stopContentMarkers => stopContentMarkers.stopMarkerMedia)
    @JoinColumn({ name: "stop_marker_id" })
    stopContentMarkers: StopContentMarkers;

    @ManyToOne(type => MediaGallery, mediaGallery => mediaGallery.stopMarkerMedia)
    @JoinColumn({ name: "media_id" })
    mediaGallery: MediaGallery;

}
