import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";
import { Venues } from "./venues.entity";
import { VenueMarkerMedia } from "./venue_marker_media.entity";
import { Markers } from "./markers.entity";
import { MediaGallery } from "./media_gallery.entity";
import { VenueBeforeAfterMedia } from "./venue_before_after_media.entity";

@Entity('venue_content_markers')
export class VenueContentMarkers {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    venue_id: number;

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
    yaw: string;

    @Column()
    pitch: string;

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
    marker_1_yaw: string;

    @Column()
    marker_1_pitch: string;

    @Column()
    marker_2_yaw: string;

    @Column()
    marker_2_pitch: string;

    @Column()
    marker_3_yaw: string;

    @Column()
    marker_3_pitch: string;

    @Column()
    marker_4_yaw: string;

    @Column()
    marker_4_pitch: string;

    @Column()
    marker_5_yaw: string;

    @Column()
    marker_5_pitch: string;

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

    @ManyToOne(type => Venues, venues => venues.venueContentMarkers)
    @JoinColumn({ name: "venue_id" })
    venues: Venues;

    @OneToMany(type => VenueMarkerMedia, venueMarkerMedia => venueMarkerMedia.venueContentMarkers)
    @JoinColumn({ name: "venue_marker_id" })
    venueMarkerMedia: VenueMarkerMedia[];

    @OneToMany(type => VenueBeforeAfterMedia, venueBeforeAfterMedia => venueBeforeAfterMedia.venueContentMarkers)
    @JoinColumn({ name: "venue_marker_id" })
    venueBeforeAfterMedia: VenueBeforeAfterMedia[];

    @ManyToOne(type => Markers, markers => markers.venueContentMarkers)
    @JoinColumn({ name: "marker_id" })
    marker: Markers;

    @ManyToOne(type => MediaGallery, mediaGallery => mediaGallery.beforeImage)
    @JoinColumn({ name: "before_image" })
    beforImageDetail: MediaGallery;

    @ManyToOne(type => MediaGallery, mediaGallery => mediaGallery.afterImage)
    @JoinColumn({ name: "after_image" })
    afterImageDetail: MediaGallery;


}
