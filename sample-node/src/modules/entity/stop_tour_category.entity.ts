import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { MediaGallery } from "./media_gallery.entity";
import { PoiDetails } from "./poi_details.entity";

@Entity('stop_tour_categories')
export class StopTourCategory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    stop_id: number;

    @Column()
    category_id: number;

    @CreateDateColumn()
    public created_at: Date;

    @UpdateDateColumn()
    public updated_at: Date;
}
