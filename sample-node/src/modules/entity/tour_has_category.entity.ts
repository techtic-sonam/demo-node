import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { MediaGallery } from "./media_gallery.entity";
import { PoiDetails } from "./poi_details.entity";
import { Tours } from "./tours.entity";

@Entity('tour_has_categories')
export class TourHasCategories {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    tour_id: number;

    @Column()
    category_id: number;

    @Column()
    coming_soon: number;

    @CreateDateColumn()
    public created_at: Date;

    @UpdateDateColumn()
    public updated_at: Date;


    @ManyToOne(type => Tours, tours => tours.tourHasCategories)
    @JoinColumn({ name: "tour_id" })
    tours: Tours;
}
