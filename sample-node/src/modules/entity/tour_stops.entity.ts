import { Entity, PrimaryGeneratedColumn, JoinColumn, Column, ManyToMany, OneToMany, JoinTable, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne } from "typeorm";
import { Stop } from "./stops.entity";
import { Tours } from "./tours.entity";

@Entity('tour_stops')
export class TourStops {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    tour_id: number;

    @Column()
    stop_id: number;

    @Column()
    latitude: string;

    @Column()
    longitude: string;

    @Column()
    order: number;

    @CreateDateColumn()
    public created_at: Date;

    @UpdateDateColumn()
    public updated_at: Date;

    @ManyToOne(type => Tours, tours => tours.tourStops)
    @JoinColumn({ name: "tour_id" })
    tours: Tours;

    @ManyToOne(type => Stop, stop => stop.tourStops)
    @JoinColumn({ name: "stop_id" })
    stop: Stop;

}
