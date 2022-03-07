import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";
import { VenueMarkerMedia } from "./venue_marker_media.entity";
import { Markers } from "./markers.entity";
import { MediaGallery } from "./media_gallery.entity";
import { VenueBeforeAfterMedia } from "./venue_before_after_media.entity";
import { Stop } from "./stops.entity";
import { StopMarkerMedia } from "./stop_marker_media.entity";
import { StopBeforeAfterMedia } from "./stop_before_after_media.entity";

@Entity('stop_content_markers')
export class StopContentMarkers {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    stop_id: number;

    @Column()
    marker_id: number;

    @Column()
    hotspot_marker_name: string;

    @Column()
    is_info_marker_text: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column()
    address: string;

    @Column()
    offer_text: string;

    @Column()
    offer_url: string;

    @Column()
    website: string;

    @Column()
    video_link: string;

    @Column()
    information_marker_1: string;

    @Column()
    information_marker_2: string;

    @Column()
    information_marker_3: string;

    @Column()
    information_marker_4: string;

    @Column()
    information_marker_5: string;


    @Column()
    information_marker_1_name: string;

    @Column()
    information_marker_2_name: string;

    @Column()
    information_marker_3_name: string;

    @Column()
    information_marker_4_name: string;

    @Column()
    information_marker_5_name: string;

    @Column()
    before_image: number;

    @Column()
    after_image: number;

    @CreateDateColumn()
    public created_at: Date;

    @UpdateDateColumn()
    public updated_at: Date;

    @DeleteDateColumn()
    public deleted_at: Date;

    @ManyToOne(type => Stop, stops => stops.stopContentMarkers)
    @JoinColumn({ name: "stop_id" })
    stops: Stop;

    @OneToMany(type => StopMarkerMedia, stopMarkerMedia => stopMarkerMedia.stopContentMarkers)
    @JoinColumn({ name: "stop_marker_id" })
    stopMarkerMedia: StopMarkerMedia[];

    @OneToMany(type => StopBeforeAfterMedia, stopBeforeAfterMedia => stopBeforeAfterMedia.stopContentMarkers)
    @JoinColumn({ name: "stop_marker_id" })
    stopBeforeAfterMedia: StopBeforeAfterMedia[];

    @ManyToOne(type => Markers, markers => markers.stopContentMarkers)
    @JoinColumn({ name: "marker_id" })
    marker: Markers;

    @ManyToOne(type => MediaGallery, mediaGallery => mediaGallery.beforeImage)
    @JoinColumn({ name: "before_image" })
    beforImageDetail: MediaGallery;

    @ManyToOne(type => MediaGallery, mediaGallery => mediaGallery.afterImage)
    @JoinColumn({ name: "after_image" })
    afterImageDetail: MediaGallery;


}
