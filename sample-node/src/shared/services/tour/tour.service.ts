import {
  Injectable,
  BadRequestException,
  Inject,
  forwardRef,
  NotAcceptableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, LessThanOrEqual } from 'typeorm';
import * as crypto from 'crypto';
import { User } from 'src/modules/entity/user.entity';
import { Setting } from 'src/modules/entity/settings.entity';
import { Pagination } from 'src/shared/class';
import { bindDataTableQuery, saveBase64Image } from 'src/shared/helpers/utill';
var randomize = require('randomatic');
import { pick } from 'lodash';
import { EmailService } from '../email/email.service';
import * as nunjucks from 'nunjucks';
import { SelectQueryBuilder, getConnection, In } from 'typeorm';
import { UserHasRole } from 'src/modules/entity/userHasRole.entity';
import { Role } from 'src/modules/entity/role.entity';
import { PoiCategories } from 'src/modules/entity/poi_cetgory.entity';
import { PoiDetails } from 'src/modules/entity/poi_details.entity';
import { MediaGallery } from 'src/modules/entity/media_gallery.entity';
import { PoiMedia } from 'src/modules/entity/poi_media.entity';
import { PoiTourCategory } from 'src/modules/entity/poi_tour_category.entity';
import { Tours } from 'src/modules/entity/tours.entity';
import { TourHasCategories } from 'src/modules/entity/tour_has_category.entity';
import { TourStops } from 'src/modules/entity/tour_stops.entity';
import { TourEmbededWebsite } from 'src/modules/entity/tour_emeded_website.entity';
import { TourMarketOverview } from 'src/modules/entity/tour_market_overview.entity';

@Injectable()
export class TourService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
    @Inject(forwardRef(() => EmailService))
    private readonly emailService: EmailService,
    @InjectRepository(UserHasRole)
    private readonly userHasRoleRepository: Repository<UserHasRole>,
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
    @InjectRepository(Tours)
    private readonly toursRepository: Repository<Tours>,
    @InjectRepository(MediaGallery)
    private readonly mediaRepository: Repository<MediaGallery>,
    @InjectRepository(PoiTourCategory)
    private readonly poiTourCategoryRepository: Repository<PoiTourCategory>,
    @InjectRepository(TourHasCategories)
    private readonly tourHasCategoriesRepository: Repository<TourHasCategories>,
    @InjectRepository(TourStops)
    private readonly tourStopsRepository: Repository<TourStops>,
    @InjectRepository(TourEmbededWebsite)
    private readonly tourEmbededWebsiteRepository: Repository<
      TourEmbededWebsite
    >,
    @InjectRepository(TourMarketOverview)
    private readonly tourMarketOverviewRepository: Repository<
      TourMarketOverview
    >,
  ) {}

  async getTourList(request): Promise<any> {
    let input = request.query;
    let userData = request.user;

    const query = await this.toursRepository
      .createQueryBuilder('tours')
      .leftJoinAndSelect('tours.tourImage', 'tourImage');

    if (input.sortBy && input.sortBy != '') {
      let orderDirection: any = input.sortDesc == 'true' ? 'DESC' : 'ASC';
      query.orderBy(`tours.${input.sortBy}`, orderDirection);
    } else {
      query.orderBy('tours.id', 'DESC');
    }
    if (request.user.roles[0].name != 'admin') {
      query.andWhere('(tours.user_id = :id OR tours.assigned_user = :id)', {
        id: userData.id,
      });
    }

    if (input.search && input.search != '') {
      query.andWhere(`tours.name LIKE :search`, {
        search: `%${input.search}%`,
      });
    }

    let limit = 10;
    if (input.limit && input.limit != '') {
      limit = input.limit;
    }

    let page = 0;
    if (input.page && input.page != '') {
      page = input.page;
    }

    let isActive = false;
    if (input.isActive && input.isActive == 'true') {
      isActive = true;
    } else {
      query.andWhere('tours.deleted_at != ""');
    }

    let response = await new Pagination(query, Tours, isActive).paginate(
      limit,
      page,
    );

    for (var i = 0; i < response['data'].length; i++) {
      var data = response['data'][i];

      const stops = await this.tourStopsRepository
        .createQueryBuilder('tour_stops')
        .leftJoinAndSelect('tour_stops.stop', 'stop')
        .leftJoinAndSelect('stop.venues', 'venues')
        .leftJoinAndSelect('stop.stopPois', 'stopPois')
        .leftJoinAndSelect('venues.venuePoi', 'venuePoi')
        .where('tour_stops.tour_id = :id', { id: data.id })
        .withDeleted()
        .getMany();

      var stopCount = stops.length;
      response['data'][i]['stopCount'] = stopCount ? stopCount : '-';
      let venueCount = 0;
      let poiCount = 0;
      for (var stopIndex = 0; stopIndex < stops.length; stopIndex++) {
        if (stops[stopIndex].stop) {
          if (stops[stopIndex].stop.venues) {
            venueCount += stops[stopIndex].stop.venues.length;
          }
          poiCount += stops[stopIndex].stop.stopPois.length;
        }
      }
      response['data'][i]['venueCount'] = venueCount ? venueCount : '-';
      response['data'][i]['poiCount'] = poiCount ? poiCount : '-';
    }

    return response;
  }

  async deleteTour(id): Promise<any> {
    var res = await this.toursRepository.softDelete({ id: id });
    return res;
  }

  async restore(input: any) {
    var res = await this.toursRepository.restore({ id: input.id });
    return res;
  }

  async getTourDetail(id, user) {
    try {
      let response = await this.toursRepository
        .createQueryBuilder('tours')
        .leftJoinAndSelect('tours.tourImage', 'tourImage')
        .leftJoinAndSelect('tours.landingLogo', 'landingLogo')
        .leftJoinAndSelect('tours.landingBackground', 'landingBackground')
        .leftJoinAndSelect('tours.user', 'user')
        .leftJoinAndSelect('tours.tourStops', 'tourStops')
        .leftJoinAndSelect('tourStops.stop', 'stop')
        .leftJoinAndSelect('stop.streetPhoto', 'stopDetail')
        .leftJoinAndSelect('tours.tourCategory', 'tourCategory')
        .leftJoinAndSelect('tours.tourHasCategories', 'tourHasCategories')
        .leftJoinAndSelect('tours.tourEmbededWebsite', 'tourEmbededWebsite')
        .leftJoinAndSelect('tours.tourMarketOverview', 'tourMarketOverview')
        .where('tours.id = :id', { id: id })
        .withDeleted()
        .getOne();

      if (
        user.roles[0].name != 'admin' &&
        response.user_id != user.id &&
        response.assigned_user != user.id
      ) {
        throw new Error('Not authorised');
      }

      if (response.tourStops) {
        response.tourStops.sort(function(a, b) {
          if (a.order < b.order) return -1;
          if (a.order > b.order) return 1;
          return 0;
        });
      }
      return response;
    } catch (error) {
      throw error;
    }
  }

  async createTour(payload, user): Promise<any> {
    try {
      let tour = new Tours();

      if (payload.name) {
        tour.name = payload.name;
      }

      if (payload.description) {
        tour.description = payload.description;
      }

      if (payload.welcome_bar_text) {
        tour.welcome_bar_text = payload.welcome_bar_text;
      }

      if (payload.initial_zoom) {
        tour.initial_zoom = payload.initial_zoom;
      }

      if (payload.preview_zoom_level) {
        tour.preview_zoom_level = payload.preview_zoom_level;
      }

      if (payload.assigned_user) {
        tour.assigned_user = payload.assigned_user;
      }

      if (payload.user_permission) {
        tour.user_permission = payload.user_permission;
      }

      if (payload.gtm_header_script) {
        tour.gtm_header_script = payload.gtm_header_script;
      }

      if (payload.gtm_body_script) {
        tour.gtm_body_script = payload.gtm_body_script;
      }

      if (payload.tour_region) {
        tour.tour_region = JSON.stringify(payload.tour_region);
      }

      if (payload.powered_by_logo) {
        const path = saveBase64Image(payload.powered_by_logo, 'logo');
        if (path) {
          tour.powered_by_logo = path;
        }
      }

      if (payload.powered_by_text) {
        tour.powered_by_text = payload.powered_by_text;
      } else {
        tour.powered_by_text = null;
      }

      if (payload.powered_by_link) {
        tour.powered_by_link = payload.powered_by_link;
      } else {
        tour.powered_by_link = null;
      }

      if (payload.map_box_style) {
        tour.map_box_style = payload.map_box_style;
      }

      if (payload.mini_map_box_style) {
        tour.mini_map_box_style = payload.mini_map_box_style;
      }

      if (payload.terms) {
        tour.terms = payload.terms;
      }

      if (payload.privacy) {
        tour.privacy = payload.privacy;
      }

      if (payload.simple_tour != null) {
        console.log('payload.simple_tour', payload.simple_tour);
        tour.is_simple_tour =
          payload.simple_tour == 1 ? payload.simple_tour == true : false;
      }

      if (payload.is_public != null) {
        console.log('payload.is_public', payload.is_public);
        tour.is_public =
          payload.is_public == 1 ? payload.is_public == true : false;
      }

      if (payload.is_market_overview != null) {
        console.log('payload.is_market_overview', payload.is_market_overview);
        tour.is_market_overview =
          payload.is_market_overview == 1
            ? payload.is_market_overview == true
            : false;
      }

      if (payload.metatitle) {
        tour.meta_title = payload.metatitle;
      }

      if (payload.metadesc) {
        tour.meta_desc = payload.metadesc;
      }

      if (payload.tour_image) {
        let path = saveBase64Image(payload.tour_image, 'thumbnail');
        if (path) {
          let mediaGallery = new MediaGallery();
          mediaGallery.user_id = user.id;
          mediaGallery.name = path;
          mediaGallery.alt_name = payload.name;
          mediaGallery.media_name = payload.tour_image_name;
          mediaGallery.type = 'thumbnail';
          let media = await this.mediaRepository.save(mediaGallery);
          tour.image = media.id;
        }
      }

      if (payload.landing_background) {
        let path = saveBase64Image(payload.landing_background, 'image');
        if (path) {
          let mediaGallery = new MediaGallery();
          mediaGallery.user_id = user.id;
          mediaGallery.name = path;
          mediaGallery.alt_name = payload.name;
          mediaGallery.media_name = payload.landing_background_name;
          mediaGallery.type = 'image';
          let media = await this.mediaRepository.save(mediaGallery);
          tour.landing_background = media.id;
        }
      }

      if (payload.landing_logo_id) {
        tour.landing_logo = payload.landing_logo_id;
      }

      if (payload.landing_bg_id) {
        tour.landing_background = payload.landing_bg_id;
      }

      if (payload.powered_by_logo_name) {
        tour.powered_by_logo = payload.powered_by_logo_name;
      }

      if (payload.tour_image_id) {
        tour.image = payload.tour_image_id;
      }

      console.log('payload.property', payload);

      if (payload.property_1) {
        tour.property_1 = payload.property_1;
      } else {
        tour.property_1 = null;
      }
      if (payload.property_2) {
        tour.property_2 = payload.property_2;
      } else {
        tour.property_2 = null;
      }
      if (payload.property_3) {
        tour.property_3 = payload.property_3;
      } else {
        tour.property_3 = null;
      }
      if (payload.property_4) {
        tour.property_4 = payload.property_4;
      } else {
        tour.property_4 = null;
      }

      if (payload.cs_property_1) {
        tour.cs_property_1 = payload.cs_property_1;
      } else {
        tour.cs_property_1 = null;
      }
      if (payload.cs_property_2) {
        tour.cs_property_2 = payload.cs_property_2;
      } else {
        tour.cs_property_2 = null;
      }
      if (payload.cs_property_3) {
        tour.cs_property_3 = payload.cs_property_3;
      } else {
        tour.cs_property_3 = null;
      }
      if (payload.cs_property_4) {
        tour.cs_property_4 = payload.cs_property_4;
      } else {
        tour.cs_property_4 = null;
      }

      if (payload.landing_logo) {
        let path = saveBase64Image(payload.landing_logo, 'image');
        if (path) {
          let mediaGallery = new MediaGallery();
          mediaGallery.user_id = user.id;
          mediaGallery.name = path;
          mediaGallery.alt_name = payload.name;
          mediaGallery.media_name = payload.landing_logo_name;
          mediaGallery.type = 'image';
          let media = await this.mediaRepository.save(mediaGallery);
          tour.landing_logo = media.id;
        }
      }

      if (payload.image) {
        tour.image = payload.image;
      }
      console.log(payload.ispublic, 'payload.ispublic');
      if (payload.ispublic) {
        tour.is_public = payload.ispublic;
      }

      console.log(tour.is_public, 'tour.is_public');

      if (payload.metatitle) {
        tour.meta_title = payload.metatitle;
      }

      if (payload.metadesc) {
        tour.meta_desc = payload.metadesc;
      }

      if (payload.id) {
        let find = await this.toursRepository
          .createQueryBuilder('tours')
          .where('tours.id != :id', { id: payload.id })
          .andWhere('slug = :slug', { slug: payload.slug })
          .withDeleted()
          .getOne();
        if (find) {
          throw new Error('This slug is already in use.');
        }
        tour.slug = payload.slug;
        await this.toursRepository.update(payload.id, tour);
      } else {
        let find = await this.toursRepository
          .createQueryBuilder('tours')
          .where('slug = :slug', { slug: payload.slug })
          .withDeleted()
          .getOne();
        if (find) {
          throw new Error('This slug is already in use.');
        }

        tour.user_id = user.id;
        tour.slug = payload.slug;
        let data = await this.toursRepository.save(tour);
        payload.id = data.id;
        this.updateUniuqName(payload.id);
      }

      if (payload.tour_categories) {
        console.log('payload.categories', payload.tour_categories);

        await this.tourHasCategoriesRepository.delete({ tour_id: payload.id });
        payload.tour_categories.forEach(async id => {
          console.log('id', id);
          console.log('payload.coming_soon',payload.coming_soon);
          await this.addTourCategory(payload.id, id, payload.coming_soon);
        });
      }

      if (payload.embeded_websites) {
        await this.tourEmbededWebsiteRepository.delete({ tour_id: payload.id });
        payload.embeded_websites.forEach(async website => {
          if (website != '') {
            await this.addTourEmbededWebsites(payload.id, website);
          }
        });
      }

      if (payload.market_overview) {
        await this.tourEmbededWebsiteRepository.delete({ tour_id: payload.id });
        payload.market_overview.forEach(async market_overview => {
          await this.addTourMarketOverview(payload.id, market_overview);
        });
      }

      if (payload.stops) {
        //await this.tourStopsRepository.delete({ tour_id: payload.id });

        let stops = payload.stops;
        let insertedStop = [];
        for (var i = 0; i < stops.length; i++) {
          let order = i + 1;
          insertedStop.push(stops[i].id);
          await this.addTourStops(payload.id, stops[i], order);
        }

        var allCompMarker = await this.tourStopsRepository
          .createQueryBuilder('tour_stops')
          .where('tour_id  = :id', { id: payload.id })
          .getMany();

        for (
          var markerIndex = 0;
          markerIndex < allCompMarker.length;
          markerIndex++
        ) {
          if (insertedStop.indexOf(allCompMarker[markerIndex].stop_id) == -1) {
            await this.tourStopsRepository.delete({
              id: allCompMarker[markerIndex].id,
            });
          }
        }
      }

      let response = await this.getTourDetail(payload.id, user);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async addTourMarketOverview(tourId, marketOverview) {
    let find = await this.tourMarketOverviewRepository.findOne({
      tour_id: tourId,
      category: marketOverview.category,
    });
    let data = { quater: marketOverview.quater };
    if (marketOverview.category == 'Residential') {
      data['quater'] = marketOverview.quater;
      data['resedential_occupancy_rate'] =
        marketOverview.resedential_occupancy_rate;
      data['resedential_rent_psf'] = marketOverview.resedential_rent_psf;
      data['resedential_average_rent'] =
        marketOverview.resedential_average_rent;
      data['resedential_condo_sale'] = marketOverview.resedential_condo_sale;
      data['resedential_condo_price_psf'] =
        marketOverview.resedential_condo_price_psf;
      data['document_file'] = marketOverview.document_file;

      if (find) {
        await this.tourMarketOverviewRepository.update(find.id, data);
      } else {
        data['tour_id'] = tourId;
        data['category'] = marketOverview.category;
        await this.tourMarketOverviewRepository.save(data);
      }
    } else if (marketOverview.category == 'Retail') {
      data['quater'] = marketOverview.quater;
      data['retail_vacancy_rate'] = marketOverview.retail_vacancy_rate;
      data['retail_average_rent_psf'] = marketOverview.retail_average_rent_psf;
      data['retail_ytd_net_absorption'] =
        marketOverview.retail_ytd_net_absorption;
      data['document_file'] = marketOverview.document_file;
      if (find) {
        await this.tourMarketOverviewRepository.update(find.id, data);
      } else {
        data['tour_id'] = tourId;
        data['category'] = marketOverview.category;
        await this.tourMarketOverviewRepository.save(data);
      }
    } else if (marketOverview.category == 'Office') {
      data['quater'] = marketOverview.quater;
      data['office_vacancy_rate'] = marketOverview.office_vacancy_rate;
      data['office_class_a_rent_psf'] = marketOverview.office_class_a_rent_psf;
      data['office_overall_rent_psf'] = marketOverview.office_overall_rent_psf;
      data['office_oytd_net_absorption'] =
        marketOverview.office_oytd_net_absorption;
      data['office_ytd_leasing_activity'] =
        marketOverview.office_ytd_leasing_activity;
      data['document_file'] = marketOverview.document_file;

      if (find) {
        await this.tourMarketOverviewRepository.update(find.id, data);
      } else {
        data['tour_id'] = tourId;
        data['category'] = marketOverview.category;
        await this.tourMarketOverviewRepository.save(data);
      }
    } else if (marketOverview.category == 'Hotel') {
      data['quater'] = marketOverview.quater;
      data['hotel_ytd_occupancy_rate'] =
        marketOverview.hotel_ytd_occupancy_rate;
      data['hotel_ytd_average_daily_rate'] =
        marketOverview.hotel_ytd_average_daily_rate;
      data['hotel_ytd_revpar'] = marketOverview.hotel_ytd_revpar;
      data['document_file'] = marketOverview.document_file;

      if (find) {
        await this.tourMarketOverviewRepository.update(find.id, data);
      } else {
        data['tour_id'] = tourId;
        data['category'] = marketOverview.category;
        await this.tourMarketOverviewRepository.save(data);
      }
    }
  }

  async addTourCategory(tourId, categoryId, comingSoon) {
    let tourCategory = new TourHasCategories();
    tourCategory.tour_id = tourId;
    tourCategory.category_id = categoryId;
    if (comingSoon.indexOf(categoryId) != -1) {
      tourCategory.coming_soon = 1;
    }
    await this.tourHasCategoriesRepository.save(tourCategory);
  }

    let tourCategory = new TourHasCategories();
    tourCategory.coming_soon = 1;
    console.log("categoryId",categoryId);
    console.log("tourId",tourId);
    let find = await this.tourHasCategoriesRepository.findOne({
      tour_id: tourId,
      category_id: categoryId,
    });
    if (find) {
       console.log("find",find);
      console.log("tourCategory",tourCategory);
      await this.tourHasCategoriesRepository.update(find.id, tourCategory);
    }
  }*/

  async addTourEmbededWebsites(tourId, website) {
    let tourEmbededWebsite = new TourEmbededWebsite();
    tourEmbededWebsite.tour_id = tourId;
    tourEmbededWebsite.website = website;
    await this.tourEmbededWebsiteRepository.save(tourEmbededWebsite);
  }

  async updateUniuqName(id) {
    var name = 'T' + id;
    let tour = new Tours();
    tour.unique_name = name;
    await this.toursRepository.update(id, tour);
    return true;
  }

  async addTourStops(tourId, stop, order) {
    let tourStop = new TourStops();
    tourStop.order = order;
    tourStop.latitude = stop.latitude;
    tourStop.longitude = stop.longitude;

    let find = await this.tourStopsRepository.findOne({
      tour_id: tourId,
      stop_id: stop.id,
    });
    if (find) {
      await this.tourStopsRepository.update(find.id, tourStop);
    } else {
      tourStop.tour_id = tourId;
      tourStop.stop_id = stop.id;
      await this.tourStopsRepository.save(tourStop);
    }
  }
}
