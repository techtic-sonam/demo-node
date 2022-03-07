import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";

@Entity('tour_venue')
export class TourVenue {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    tour_id: number;

    @Column()
    venue_id: number;

    @CreateDateColumn()
    public created_at: Date;

    @UpdateDateColumn()
    public updated_at: Date;

}
