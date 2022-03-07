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
  OneToOne,
  Index,
} from 'typeorm';
import { Stop } from './stops.entity';
import { TourStops } from './tour_stops.entity';
import { MediaGallery } from './media_gallery.entity';
import { TourCategory } from './tour_category.entity';
import { type } from 'os';
import { User } from './user.entity';
import { TourEmbededWebsite } from './tour_emeded_website.entity';
import { TourMarketOverview } from './tour_market_overview.entity';
import { TourHasCategories } from './tour_has_category.entity';

@Entity('tours')
export class Tours {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  unique_name: string;

  @Column()
  user_id: number;

  @Column()
  assigned_user: number;

  @Column()
  user_permission: number;

  @Column()
  image: number;

  @Column()
  name: string;

  @Column()
  initial_zoom: string;

  @Column()
  preview_zoom_level: string;

  @Column()
  slug: string;

  @Column()
  description: string;

  @Column()
  gtm_header_script: string;

  @Column()
  gtm_body_script: string;

  @Column()
  powered_by_text: string;

  @Column()
  powered_by_logo: string;

  @Column()
  powered_by_link: string;

  @Column()
  map_box_style: string;

  @Column()
  mini_map_box_style: string;

  @Column()
  latitude: string;

  @Column()
  longitude: string;

  @Column()
  welcome_bar_text: string;

  @Column()
  terms: string;

  @Column()
  privacy: string;

  @Column()
  is_simple_tour: boolean;

  @Column()
  //@Index({ spatial: true })
  tour_region: string;

  @Column()
  landing_background: number;

  @Column()
  landing_logo: number;

  @Column()
  is_public: boolean;

  @Column()
  is_market_overview: boolean;

  @Column()
  meta_title: string;

  @Column()
  meta_desc: string;

  @Column()
  property_1: number;

  @Column()
  property_2: number;

  @Column()
  property_3: number;

  @Column()
  property_4: number;

  @Column()
  cs_property_1: number;

  @Column()
  cs_property_2: number;

  @Column()
  cs_property_3: number;

  @Column()
  cs_property_4: number;


  @CreateDateColumn()
  public created_at: Date;

  @UpdateDateColumn()
  public updated_at: Date;

  @DeleteDateColumn()
  public deleted_at: Date;



  @OneToMany(
    type => TourHasCategories,
    tourHasCategories => tourHasCategories.tours,
  )
  @JoinColumn({ name: 'tour_id' })
  tourHasCategories: TourHasCategories[];

  @ManyToMany(type => Stop, { eager: true })
  @JoinTable({
    name: 'tour_stops',
    joinColumns: [{ name: 'tour_id' }],
    inverseJoinColumns: [{ name: 'stop_id' }],
  })
  stop: Stop[];

  @ManyToMany(type => TourCategory, { eager: true })
  @JoinTable({
    name: 'tour_has_categories',
    joinColumns: [{ name: 'tour_id' }],
    inverseJoinColumns: [{ name: 'category_id' }],
  })
  tourCategory: TourCategory[];

  @OneToMany(
    type => TourStops,
    tourStops => tourStops.tours,
  )
  @JoinColumn({ name: 'tour_id' })
  tourStops: TourStops[];

  @ManyToOne(
    type => MediaGallery,
    mediaGallery => mediaGallery.tourImage,
  )
  @JoinColumn({ name: 'image' })
  tourImage: MediaGallery;

  @ManyToOne(
    type => User,
    user => user.user,
  )
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(
    type => TourEmbededWebsite,
    tourEmbededWebsite => tourEmbededWebsite.tours,
  )
  tourEmbededWebsite: TourEmbededWebsite[];

  @OneToMany(
    type => TourMarketOverview,
    tourMarketOverview => tourMarketOverview.tours,
  )
  tourMarketOverview: TourMarketOverview[];

  @ManyToOne(
    type => MediaGallery,
    mediaGallery => mediaGallery.landingBackground,
  )
  @JoinColumn({ name: 'landing_background' })
  landingBackground: MediaGallery;

  @ManyToOne(
    type => MediaGallery,
    mediaGallery => mediaGallery.landingLogo,
  )
  @JoinColumn({ name: 'landing_logo' })
  landingLogo: MediaGallery;
}
