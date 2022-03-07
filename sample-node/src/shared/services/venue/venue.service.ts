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
import { Markers } from 'src/modules/entity/markers.entity';
import { Venues } from 'src/modules/entity/venues.entity';
import { MediaGallery } from 'src/modules/entity/media_gallery.entity';
import { VenueTourCategory } from 'src/modules/entity/venue_tour_category.entity';
import { StopVenue } from 'src/modules/entity/stop_venues.entity';
import { VenueContentMarkers } from 'src/modules/entity/venue_content_markers.entity';
import { VenueMarkerMedia } from 'src/modules/entity/venue_marker_media.entity';
import { VenuePoi } from 'src/modules/entity/venue_poi.entity';
import { VenueBeforeAfterMedia } from 'src/modules/entity/venue_before_after_media.entity';
import { identity } from 'rxjs';
import { _ } from 'underscore';
import { NearByVenue } from 'src/modules/entity/near_by_venues.entity';
import * as fs from 'fs';
import * as unzipper from 'unzipper';
import * as ncp from 'ncp';
import { ConfigService } from '@nestjs/config';
var convert = require('xml-js');

@Injectable()
export class VenueService {
  tileurl: any;
  private configService: any;
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
    @Inject(forwardRef(() => EmailService))
    private readonly emailService: EmailService,
    @InjectRepository(UserHasRole)
    private readonly userHasRoleRepository: Repository<UserHasRole>,
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
    @InjectRepository(Markers)
    private readonly markersRepository: Repository<Markers>,
    @InjectRepository(Venues)
    private readonly venueRepository: Repository<Venues>,
    @InjectRepository(MediaGallery)
    private readonly mediaRepository: Repository<MediaGallery>,
    @InjectRepository(VenueTourCategory)
    private readonly venueTourRepository: Repository<VenueTourCategory>,
    @InjectRepository(StopVenue)
    private readonly stopVenueRepository: Repository<StopVenue>,
    @InjectRepository(VenuePoi)
    private readonly venuePoiRepository: Repository<VenuePoi>,
    @InjectRepository(VenueContentMarkers)
    private readonly venueContentMarkersRepository: Repository<
      VenueContentMarkers
    >,
    @InjectRepository(VenueMarkerMedia)
    private readonly venueMarkerMediaRepository: Repository<VenueMarkerMedia>,
    @InjectRepository(NearByVenue)
    private readonly nearByVenueRepository: Repository<NearByVenue>,
    @InjectRepository(VenueBeforeAfterMedia)
    private readonly venueBeforeAfterRepository: Repository<
      VenueBeforeAfterMedia
    >,
  ) {
    this.configService = new ConfigService();
  }

  async getMarkers() {
    let markersData = await this.markersRepository
      .createQueryBuilder('markers')
      .getMany();
    return markersData;
  }

  async getVenues(request) {
    let input = request.query;
    let userData = request.user;
    const query = await this.venueRepository
      .createQueryBuilder('venues')
      .leftJoinAndSelect('venues.streetPhoto', 'streetPhoto')
      .leftJoinAndSelect('venues.nearByVenue', 'nearByVenue')
      .leftJoinAndSelect('nearByVenue.venueDetail', 'venueDetail')
      .leftJoinAndSelect('venueDetail.streetPhoto', 'venueDetailstreetPhoto');

    query.groupBy('venues.id');

    if (input.sortBy && input.sortBy != '') {
      let orderDirection: any = input.sortDesc == 'true' ? 'DESC' : 'ASC';
      query.orderBy(`venues.${input.sortBy}`, orderDirection);
    } else {
      query.orderBy('venues.id', 'DESC');
    }

    if (request.user.roles[0].name != 'admin') {
      query.andWhere(
        '(venues.user_id = :userId OR venues.assigned_user = :userId)',
        {
          userId: userData.id,
        },
      );
    }

    if (input.id && input.id != '') {
      query.andWhere('venues.id != :id', { id: input.id });
    }

    if (input.search && input.search != '') {
      query.andWhere(`venues.name LIKE :search`, {
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
      query.andWhere('venues.deleted_at != ""');
    }

    let response = await new Pagination(query, Venues, isActive).paginate(
      limit,
      page,
    );

    for (var i = 0; i < response['data'].length; i++) {
      var data = response['data'][i];
      const res = await this.venueRepository
        .createQueryBuilder('venues')
        .leftJoinAndSelect('venues.stop', 'stop')
        .leftJoinAndSelect('stop.tours', 'tours')
        .where('venues.id = :id', { id: data.id })
        .withDeleted()
        .getOne();

      var stopCount = res.stop.length;
      let tourCount = 0;
      response['data'][i]['stopCount'] = stopCount ? stopCount : '-';
      res.stop.forEach(async stop => {
        tourCount += stop['tours'].length;
      });
      response['data'][i]['tourCount'] = tourCount ? tourCount : '-';
    }

    return response;
  }

  async deleteVenue(id): Promise<any> {
    var res = await this.venueRepository.softDelete({ id: id });
    return res;
  }

  async restoreVenue(input: any) {
    var res = await this.venueRepository.restore({ id: input.id });
    return res;
  }

  async getVenue(id, user) {
    try {
      let response = await this.venueRepository
        .createQueryBuilder('venues')
        .leftJoinAndSelect('venues.panorama', 'panorama')
        .leftJoinAndSelect('venues.streetPhoto', 'streetPhoto')
        .leftJoinAndSelect('venues.stopVenue', 'stopVenue')
        .leftJoinAndSelect('stopVenue.stop', 'stop')
        .leftJoinAndSelect('stop.panorama', 'stop_panorama')
        .leftJoinAndSelect('venues.venuePoi', 'venuePoi')
        .leftJoinAndSelect('venuePoi.poiDetails', 'poiDetails')
        .leftJoinAndSelect('poiDetails.poiMedia', 'poiMedia')
        .leftJoinAndSelect('poiMedia.mediaGallery', 'poimediaGallery')
        .leftJoinAndSelect('poiDetails.categories', 'poiCategories')
        .leftJoinAndSelect('venues.nearByVenue', 'nearByVenue')
        .leftJoinAndSelect('nearByVenue.venueDetail', 'venueDetail')
        .leftJoinAndSelect('venueDetail.streetPhoto', 'venueDetailstreetPhoto')
        .leftJoinAndSelect('stop.streetPhoto', 'stop_streetPhoto')
        .leftJoinAndSelect('venues.tourCategory', 'tourCategory')
        .leftJoinAndSelect('venues.venueContentMarkers', 'venueContentMarkers')
        .leftJoinAndSelect('venueContentMarkers.marker', 'marker')
        .leftJoinAndSelect(
          'venueContentMarkers.venueBeforeAfterMedia',
          'venueBeforeAfterMedia',
        )
        .leftJoinAndSelect(
          'venueBeforeAfterMedia.mediaBeforeGallery',
          'mediaBeforeGallery',
        )
        .leftJoinAndSelect(
          'venueBeforeAfterMedia.mediaAfterGallery',
          'mediaAfterGallery',
        )
        .leftJoinAndSelect(
          'venueContentMarkers.venueMarkerMedia',
          'venueMarkerMedia',
        )
        .leftJoinAndSelect('venueMarkerMedia.mediaGallery', 'mediaGallery')
        .where('venues.id = :id', { id: id })
        .withDeleted()
        .getOne();

      if (
        user.roles[0].name != 'admin' &&
        response.user_id != user.id &&
        response.assigned_user != user.id
      ) {
        throw new Error('Not authorised');
      }

      if (response.venueContentMarkers && response.venueContentMarkers.length) {
        for (var i = 0; i < response.venueContentMarkers.length; i++) {
          let venueMarker = response.venueContentMarkers[i];
          if (
            venueMarker.marker.name == 'image' ||
            venueMarker.marker.name == 'feature'
          ) {
            venueMarker.venueMarkerMedia.sort(function(a, b) {
              if (a.order < b.order) return -1;
              if (a.order > b.order) return 1;
              return 0;
            });
          }
        }
      }

      if (response.nearByVenue) {
        response.nearByVenue.sort(function(a, b) {
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

  async getContentMarkers(id) {
    let response = await this.venueContentMarkersRepository
      .createQueryBuilder('venueContentMarkers')
      .leftJoinAndSelect('venueContentMarkers.marker', 'marker')
      .leftJoinAndSelect(
        'venueContentMarkers.beforImageDetail',
        'beforImageDetail',
      )
      .leftJoinAndSelect(
        'venueContentMarkers.afterImageDetail',
        'afterImageDetail',
      )
      .leftJoinAndSelect(
        'venueContentMarkers.venueMarkerMedia',
        'venueMarkerMedia',
      )
      .leftJoinAndSelect('venueMarkerMedia.mediaGallery', 'mediaGallery')
      .leftJoinAndSelect(
        'venueContentMarkers.venueBeforeAfterMedia',
        'venueBeforeAfterMedia',
      )
      .leftJoinAndSelect(
        'venueBeforeAfterMedia.mediaBeforeGallery',
        'mediaBeforeGallery',
      )
      .leftJoinAndSelect(
        'venueBeforeAfterMedia.mediaAfterGallery',
        'mediaAfterGallery',
      )
      .where('venueContentMarkers.id = :id', { id: id })
      .withDeleted()
      .getOne();

    return response;
  }

  async createVenue(payload, user): Promise<any> {
    try {
      var hotSpotdata = payload.hotspotInfo;

      let venue = new Venues();

      if (payload.name) {
        venue.name = payload.name;
      }

      if (payload.url) {
        venue.url = payload.url;
      }

      if (payload.street_address) {
        venue.street_address = payload.street_address;
      }

      if (payload.phone) {
        venue.phone = payload.phone;
      }

      if (payload.header_1) {
        venue.header_1 = payload.header_1;
      } else {
        venue.header_1 = null;
      }

      if (payload.header_2) {
        venue.header_2 = payload.header_2;
      } else {
        venue.header_2 = null;
      }

      if (payload.header_3) {
        venue.header_3 = payload.header_3;
      } else {
        venue.header_3 = null;
      }

      if (payload.header_4) {
        venue.header_4 = payload.header_4;
      } else {
        venue.header_4 = null;
      }

      if (payload.header_5) {
        venue.header_5 = payload.header_5;
      } else {
        venue.header_5 = null;
      }

      if (payload.text_1) {
        venue.text_1 = payload.text_1;
      } else {
        venue.text_1 = null;
      }

      if (payload.text_2) {
        venue.text_2 = payload.text_2;
      } else {
        venue.text_2 = null;
      }

      if (payload.text_3) {
        venue.text_3 = payload.text_3;
      } else {
        venue.text_3 = null;
      }

      if (payload.text_4) {
        venue.text_4 = payload.text_4;
      } else {
        venue.text_4 = null;
      }

      if (payload.text_5) {
        venue.text_5 = payload.text_5;
      } else {
        venue.text_5 = null;
      }

      if (payload.yaw) {
        venue.yaw = payload.yaw;
      }

      if (payload.pitch) {
        venue.pitch = payload.pitch;
      }

      if (payload.fov) {
        venue.fov = payload.fov;
      }

      if (payload.roll) {
        venue.roll = payload.roll;
      }

      if (payload.latitude) {
        venue.latitude = payload.latitude;
      }

      if (payload.zoom_level) {
        venue.zoom_level = payload.zoom_level;
      }

      if (payload.longitude) {
        venue.longitude = payload.longitude;
      }

      if (payload.assigned_user) {
        venue.assigned_user = payload.assigned_user;
      }

      if (payload.user_permission) {
        venue.user_permission = payload.user_permission;
      }

      if (payload.venue_image_id) {
        venue.street_photo_id = payload.venue_image_id;
      }

      if (payload.metatitle) {
        venue.meta_title = payload.metatitle;
      }

      if (payload.metadesc) {
        venue.meta_desc = payload.metadesc;
      }

      if (payload.venue_image) {
        let path = saveBase64Image(payload.venue_image, 'thumbnail');
        if (path) {
          let mediaGallery = new MediaGallery();
          mediaGallery.user_id = user.id;
          mediaGallery.name = path;
          mediaGallery.alt_name = payload.name;
          mediaGallery.media_name = payload.venue_image_name;
          mediaGallery.type = 'thumbnail';
          let media = await this.mediaRepository.save(mediaGallery);
          payload.street_photo_id = media.id;
        }
      }
      if (payload.street_photo_id) {
        venue.street_photo_id = payload.street_photo_id;
      }

      if (payload.panorama_image_id) {
        payload.selectMedia = true;
      }

      if (payload.tile_name) {
        var thumPath = 'public/cube_temp/' + payload.tile_name;
        let path = await this.moveThumnailImage(thumPath);
        if (path) {
          let mediaGallery = new MediaGallery();
          mediaGallery.user_id = user.id;
          mediaGallery.name = path;
          mediaGallery.alt_name = payload.name;
          mediaGallery.media_name = payload.panorama_image_name;
          mediaGallery.type = 'panorama';
          let media = await this.mediaRepository.save(mediaGallery);
          payload.panorama_image_id = media.id;
        }
      }

      if (payload.panorama_image_id) {
        venue.panorama_image_id = payload.panorama_image_id;
      }

      let action = 'add';
      if (payload.id) {
        action = 'edit';
        let find = await this.venueRepository
          .createQueryBuilder('venues')
          .where('venues.id != :id', { id: payload.id })
          .andWhere('slug = :slug', { slug: payload.slug })
          .withDeleted()
          .getOne();
        if (find) {
          throw new Error('This slug is already in use.');
        }
        venue.slug = payload.slug;
        await this.venueRepository.update(payload.id, venue);
      } else {
        let find = await this.venueRepository
          .createQueryBuilder('venues')
          .where('slug = :slug', { slug: payload.slug })
          .withDeleted()
          .getOne();
        if (find) {
          throw new Error('This slug is already in use.');
        }
        venue.slug = payload.slug;
        venue.user_id = user.id;
        let data = await this.venueRepository.save(venue);
        payload.id = data.id;
        this.updateUniuqName(payload.id);
      }

      if (payload.tile_name) {
        var path = 'public/cube_temp/' + payload.tile_name;
        var movePath = 'public/cube/cube_gallary/' + payload.tile_name;
        payload.cube_url = 'cube_gallary/' + payload.tile_name;
        await this.moveCube(path, movePath, payload);
      }

      if (payload.selectMedia) {
        let find = await this.mediaRepository
          .createQueryBuilder('media_gallery')
          .where('id = :id', { id: payload.panorama_image_id })
          .getOne();

        if (find) {
          var cube_url = find.cube_url;
          this.tileurl = 'public/cube/' + cube_url;
        }
      }

      if (payload.panorama_image || payload.tile_name) {
        let mediaGallery = new MediaGallery();
        mediaGallery.cube_url = payload.cube_url;

        await this.mediaRepository.update(
          payload.panorama_image_id,
          mediaGallery,
        );
      }

      if (payload.tour_categories) {
        await this.venueTourRepository.delete({ venue_id: payload.id });
        payload.tour_categories.forEach(async id => {
          await this.addVenueTourCategory(payload.id, id);
        });
      }

      if (payload.stops) {
        await this.stopVenueRepository.delete({ venue_id: payload.id });
        payload.stops.forEach(async stop => {
          await this.addVenueStops(payload.id, stop);
        });
      }

      let insertedVenue = [];

      if (payload.venues) {
        let venues = payload.venues;

        for (var i = 0; i < venues.length; i++) {
          insertedVenue.push(venues[i].id);
          let order = i + 1;
          await this.addNearByVenues(payload.id, venues[i], order);
        }
        var allCompMarker = await this.nearByVenueRepository
          .createQueryBuilder('near_by_venues')
          .where('venue_id = :id', { id: payload.id })
          .getMany();

        for (
          var markerIndex = 0;
          markerIndex < allCompMarker.length;
          markerIndex++
        ) {
          if (
            insertedVenue.indexOf(
              allCompMarker[markerIndex].near_by_venue_id,
            ) == -1
          ) {
            await this.nearByVenueRepository.delete({
              id: allCompMarker[markerIndex].id,
            });
          }
        }
      }

      if (payload.remove_marker_on_edit == 1) {
        await this.venueContentMarkersRepository.delete({
          venue_id: payload.id,
        });
      }

      if (payload.markers) {
        payload.markers.forEach(async marker => {
          if(marker.marker_id){
            console.log(marker.hotspot_marker_name,"marker.hotspot_marker_name ....");
            const res = await this.venueContentMarkersRepository
                        .createQueryBuilder('venue_content_markers')
                        .where('hotspot_marker_name = :markerid', { markerid: marker.hotspot_marker_name })
                        .withDeleted()
                        .getMany();
            console.log(res,"already there info marker");
            if(res.length > 0){
              await this.venueContentMarkersRepository.delete({ hotspot_marker_name:  marker.hotspot_marker_name  });
            }
          }
          await this.addVenueMarkers(payload.id, marker, user.id, action);
        });
      }

      if (payload.pois) {
        await this.venuePoiRepository.delete({ venue_id: payload.id });
        payload.pois.forEach(async poi => {
          await this.addVenuePois(payload.id, poi);
        });
      }

      if (payload.hotspotInfo || payload.initialViewInfo) {
        await this.updateVenueXml(
          payload.hotspotInfo,
          this.tileurl,
          payload.initialViewInfo,
          payload.id,
        );
      }

      let response = await this.getVenue(payload.id, user);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateVenueXml(venueHotSpotInfo, tileurl, intitialViewInfo, venueId) {
    var currentVenueTile = tileurl + '/tour.xml';
    const xmlFile = fs.readFileSync(currentVenueTile, 'utf8');
    const jsonData = JSON.parse(
      convert.xml2json(xmlFile, { compact: true, spaces: 4 }),
    );
    var configUrl = this.configService.get('APP_URL');
    var hotspotArrData = [];
    for (let i = 0; i < venueHotSpotInfo.length; i++) {
      console.log(venueHotSpotInfo[i].name, 'markername');
      hotspotArrData.push({
        _attributes: {
          name: venueHotSpotInfo[i].name,
          url: configUrl + '/public/markers/images.png',
          ath: venueHotSpotInfo[i].ath,
          atv: venueHotSpotInfo[i].atv,
          rotate: venueHotSpotInfo[i].rotate,
          scale: venueHotSpotInfo[i].scale,
          dragging: venueHotSpotInfo[i].dragging,
          zoom: venueHotSpotInfo[i].zoom,
          renderer: venueHotSpotInfo[i].renderer,
          edge: venueHotSpotInfo[i].edge,
          x: venueHotSpotInfo[i].x,
          y: venueHotSpotInfo[i].y,
          id: venueHotSpotInfo[i].hotspotId,
        },
      });
    }

    if (intitialViewInfo != null) {
      jsonData.krpano.scene.view._attributes['hlookat'] =
        intitialViewInfo.hlookat;
      jsonData.krpano.scene.view._attributes['vlookat'] =
        intitialViewInfo.vlookat;
      jsonData.krpano.scene.view._attributes['fov'] = intitialViewInfo.fov;
    }

    jsonData.krpano.scene['hotspot'] = hotspotArrData;

    var jsonString = JSON.stringify(jsonData);

    var convertedXml = convert.json2xml(jsonString, {
      compact: true,
      spaces: 4,
    });

    var venueXml = 'venue_' + venueId + '.xml';
    const newVenueXmlFile = tileurl + '/' + venueXml;

    console.log('newStopXmlFile', newVenueXmlFile);

    fs.writeFile(newVenueXmlFile, convertedXml, 'utf8', function(err) {
      if (err) {
        console.log(err);
        return err;
      } else {
        console.log('Xml updated succesfully!');
      }
      console.log('The file was saved!');
    });

    let venue = new Venues();
    venue.xmlfile_path = venueXml;
    await this.venueRepository.update(venueId, venue);
  }

  async moveCube(path, movePath, payload) {
    var that = this;
    if (!fs.existsSync(movePath)) {
      fs.mkdir(movePath, function(err) {
        if (err) throw err;
        that.copyTiles(path, movePath);
      });
    } else {
      that.copyTiles(path, movePath);
    }
  }

  async addVenueTourCategory(venueId, categoryId) {
    let venueTourCategory = new VenueTourCategory();
    venueTourCategory.venue_id = venueId;
    venueTourCategory.category_id = categoryId;
    await this.venueTourRepository.save(venueTourCategory);
  }

  async updateUniuqName(id) {
    var name = 'V' + id;
    let venue = new Venues();
    venue.unique_name = name;
    await this.venueRepository.update(id, venue);
    return true;
  }

  async addVenueStops(venueId, stop) {
    let venueStops = new StopVenue();
    venueStops.venue_id = venueId;
    venueStops.stop_id = stop.id;
    venueStops.yaw = stop.yaw;
    venueStops.pitch = stop.pitch;
    venueStops.venue_hotspot_name = stop.venue_hotspot_name;
    await this.stopVenueRepository.save(venueStops);
  }

  async addVenuePois(venueId, poi) {
    let venuPoi = new VenuePoi();
    venuPoi.venue_id = venueId;
    venuPoi.poi_id = poi.id;
    venuPoi.yaw = poi.yaw;
    venuPoi.pitch = poi.pitch;
    venuPoi.poi_hotspot_name = poi.poi_hotspot_name;
    await this.venuePoiRepository.save(venuPoi);
  }

  async updateMarkerLocation(marker) {
    let venueMarker = new VenueContentMarkers();
    venueMarker.venue_id = marker.venue_id;
    venueMarker.marker_id = marker.marker_id;
    venueMarker.yaw = marker.yaw;
    venueMarker.pitch = marker.pitch;
    var markerData = await this.venueContentMarkersRepository.update(
      marker.id,
      venueMarker,
    );
    return markerData;
  }

  async addVenueMarkers(venueId, marker, userId, action) {
    let venueMarker = new VenueContentMarkers();
    venueMarker.venue_id = venueId;
    venueMarker.marker_id = marker.marker_id;
    venueMarker.hotspot_marker_name = marker.hotspot_marker_name;

    venueMarker.information_marker_1 = marker.information_marker_1;
    venueMarker.information_marker_1_name = marker.information_marker_1_name;

    venueMarker.information_marker_2 = marker.information_marker_2;
    venueMarker.information_marker_2_name = marker.information_marker_2_name;

    venueMarker.information_marker_3 = marker.information_marker_3;
    venueMarker.information_marker_3_name = marker.information_marker_3_name;

    venueMarker.information_marker_4 = marker.information_marker_4;
    venueMarker.information_marker_4_name = marker.information_marker_4_name;

    venueMarker.information_marker_5 = marker.information_marker_5;
    venueMarker.information_marker_5_name = marker.information_marker_5_name;

    venueMarker.video_link = marker.video_link;
    venueMarker.name = marker.name;
    venueMarker.description = marker.description;
    venueMarker.address = marker.address;
    venueMarker.offer_text = marker.offer_text;
    venueMarker.offer_url = marker.offer_url;
    venueMarker.website = marker.website;
    var markerData = await this.venueContentMarkersRepository.save(venueMarker);


    for (
      var index = 0;
      index < marker.comparisonMarker.beforeAfter.length;
      index++
    ) {
      console.log('inside for loop');
      var beforImage = marker.comparisonMarker.beforeAfter[index].before_image;
      var afterImage = marker.comparisonMarker.beforeAfter[index].after_image;
      var beforImageId =
        marker.comparisonMarker.beforeAfter[index].before_image_id;
      var afterImageId =
        marker.comparisonMarker.beforeAfter[index].after_image_id;
      var afterImageName =
        marker.comparisonMarker.beforeAfter[index].after_image_name;
      var beforeImageName =
        marker.comparisonMarker.beforeAfter[index].before_image_name;

      if ((beforImage || beforImageId) && (afterImage || afterImageId)) {
        let markerMedia = new VenueBeforeAfterMedia();
        markerMedia.venue_marker_id = markerData.id;

        if (beforImageId) {
          markerMedia.before_image_id = beforImageId;
        } else {
          let path = saveBase64Image(beforImage, 'image');
          let mediaGallery = new MediaGallery();
          mediaGallery.user_id = userId;
          mediaGallery.name = path;
          mediaGallery.alt_name = 'before';
          mediaGallery.media_name = beforeImageName;
          mediaGallery.type = 'image';
          let media = await this.mediaRepository.save(mediaGallery);
          markerMedia.before_image_id = media.id;
        }

        if (afterImageId) {
          markerMedia.after_image_id = afterImageId;
        } else {
          let afterPath = saveBase64Image(afterImage, 'image');
          let afterMediaGallery = new MediaGallery();
          afterMediaGallery.user_id = userId;
          afterMediaGallery.name = afterPath;
          afterMediaGallery.alt_name = 'after';
          afterMediaGallery.media_name = afterImageName;
          afterMediaGallery.type = 'image';
          let afterMedia = await this.mediaRepository.save(afterMediaGallery);
          markerMedia.after_image_id = afterMedia.id;
        }

        let gallary = await this.venueBeforeAfterRepository.save(markerMedia);
      }
    }
   

    if (marker.after_image) {
      let path = saveBase64Image(marker.after_image, 'image');
      if (path) {
        let mediaGallery = new MediaGallery();
        mediaGallery.user_id = userId;
        mediaGallery.name = path;
        mediaGallery.alt_name = 'before';
        mediaGallery.type = 'image';
        let media = await this.mediaRepository.save(mediaGallery);
        venueMarker.after_image = media.id;
      }
    }*/

    if (marker.media_data) {
      for (var i = 0; i < marker.media_data.length; i++) {
        var image = marker.media_data[i];
        if (image.image) {
          let path = saveBase64Image(image.image, 'image');
          let order = i + 1;
          if (path) {
            let mediaGallery = new MediaGallery();
            mediaGallery.user_id = userId;
            mediaGallery.name = path;
            mediaGallery.alt_name = image.caption;
            mediaGallery.media_name = image.media_name;
            mediaGallery.type = 'image';
            let media = await this.mediaRepository.save(mediaGallery);
            let markerMedia = new VenueMarkerMedia();
            markerMedia.venue_marker_id = markerData.id;
            markerMedia.media_id = media.id;
            markerMedia.order = order;
            let gallary = await this.venueMarkerMediaRepository.save(
              markerMedia,
            );
          }
        } else if (image.select_media_id) {
          let order = i + 1;
          let markerMedia = new VenueMarkerMedia();
          markerMedia.order = order;
          markerMedia.venue_marker_id = markerData.id;
          markerMedia.media_id = image.id;
          await this.venueMarkerMediaRepository.save(markerMedia);
        }
      }
    }

    return markerData;
  }

  async editMarker(marker, user) {
    console.log('edit marker', marker.comparisonMarker);

    let venueMarker = new VenueContentMarkers();
    venueMarker.venue_id = marker.venue_id;
    venueMarker.marker_id = marker.marker_id;
    if (marker.yaw && marker.pitch) {
      venueMarker.yaw = marker.yaw;
      venueMarker.pitch = marker.pitch;
    }
    venueMarker.information_marker_1 = marker.information_marker_1;
    venueMarker.information_marker_1_name = marker.information_marker_1_name;

    venueMarker.information_marker_2 = marker.information_marker_2;
    venueMarker.information_marker_2_name = marker.information_marker_2_name;

    venueMarker.information_marker_3 = marker.information_marker_3;
    venueMarker.information_marker_3_name = marker.information_marker_3_name;

    venueMarker.information_marker_4 = marker.information_marker_4;
    venueMarker.information_marker_4_name = marker.information_marker_4_name;

    venueMarker.information_marker_5 = marker.information_marker_5;
    venueMarker.information_marker_5_name = marker.information_marker_5_name;

    venueMarker.video_link = marker.video_link;
    venueMarker.name = marker.name;
    venueMarker.description = marker.description;
    venueMarker.address = marker.address;
    venueMarker.offer_text = marker.offer_text;
    venueMarker.offer_url = marker.offer_url;
    venueMarker.website = marker.website;

    var insertedData = [];
    if (marker.comparisonMarker) {
      for (
        var index = 0;
        index < marker.comparisonMarker.beforeAfter.length;
        index++
      ) {
        var formDetail = marker.comparisonMarker.beforeAfter[index];

        var beforImage =
          marker.comparisonMarker.beforeAfter[index].before_image;
        var afterImage = marker.comparisonMarker.beforeAfter[index].after_image;
        var beforImageId =
          marker.comparisonMarker.beforeAfter[index].before_image_id;
        var afterImageId =
          marker.comparisonMarker.beforeAfter[index].after_image_id;
        var afterImageName =
          marker.comparisonMarker.beforeAfter[index].after_image_name;
        var beforeImageName =
          marker.comparisonMarker.beforeAfter[index].before_image_name;

        if (formDetail.id) {
          if (formDetail.isBeforeEdit == 1) {
            if (beforImage) {
              let path = saveBase64Image(beforImage, 'image');
              let mediaGallery = new MediaGallery();
              mediaGallery.user_id = user.id;
              mediaGallery.name = path;
              mediaGallery.alt_name = 'before';
              mediaGallery.media_name = beforeImageName;
              mediaGallery.type = 'image';
              let media = await this.mediaRepository.save(mediaGallery);
              let markerMedia = new VenueBeforeAfterMedia();
              markerMedia.before_image_id = media.id;
              await this.venueBeforeAfterRepository.update(
                formDetail.id,
                markerMedia,
              );
            }
          } else if (beforImageId) {
            let markerMedia = new VenueBeforeAfterMedia();
            markerMedia.before_image_id = beforImageId;
            await this.venueBeforeAfterRepository.update(
              formDetail.id,
              markerMedia,
            );
          }

          if (formDetail.isAfterEdit == 1) {
            if (afterImage) {
              let afterPath = saveBase64Image(afterImage, 'image');
              let afterMediaGallery = new MediaGallery();
              afterMediaGallery.user_id = user.id;
              afterMediaGallery.name = afterPath;
              afterMediaGallery.alt_name = 'after';
              afterMediaGallery.media_name = afterImageName;
              afterMediaGallery.type = 'image';
              let afterMedia = await this.mediaRepository.save(
                afterMediaGallery,
              );
              let markerMedia = new VenueBeforeAfterMedia();
              markerMedia.after_image_id = afterMedia.id;
              await this.venueBeforeAfterRepository.update(
                formDetail.id,
                markerMedia,
              );
            }
          } else if (afterImageId) {
            let markerMedia = new VenueBeforeAfterMedia();
            markerMedia.after_image_id = afterImageId;
            await this.venueBeforeAfterRepository.update(
              formDetail.id,
              markerMedia,
            );
          }
          insertedData.push(formDetail.id);
        } else {
          if (beforImage && afterImage && !formDetail.id) {
            let path = saveBase64Image(beforImage, 'image');
            let mediaGallery = new MediaGallery();
            mediaGallery.user_id = user.id;
            mediaGallery.name = path;
            mediaGallery.alt_name = 'before';
            mediaGallery.type = 'image';
            let media = await this.mediaRepository.save(mediaGallery);

            let afterPath = saveBase64Image(afterImage, 'image');
            let afterMediaGallery = new MediaGallery();
            afterMediaGallery.user_id = user.id;
            afterMediaGallery.name = afterPath;
            afterMediaGallery.alt_name = 'after';
            afterMediaGallery.type = 'image';
            let afterMedia = await this.mediaRepository.save(afterMediaGallery);

            let markerMedia = new VenueBeforeAfterMedia();
            markerMedia.venue_marker_id = marker.id;
            markerMedia.before_image_id = beforImageId;
            markerMedia.after_image_id = afterImageId;
            let comparisonData = await this.venueBeforeAfterRepository.save(
              markerMedia,
            );

            insertedData.push(comparisonData.id);
          }
        }
      }
      var allCompMarker = await this.venueBeforeAfterRepository
        .createQueryBuilder('venue_before_after_media')
        .where('venue_marker_id = :id', { id: marker.id })
        .getMany();
      for (
        var markerIndex = 0;
        markerIndex < allCompMarker.length;
        markerIndex++
      ) {
        console.log(
          'allCompMarker[markerIndex].id',
          allCompMarker[markerIndex].id,
        );
        if (insertedData.indexOf(allCompMarker[markerIndex].id) == -1) {
          await this.venueBeforeAfterRepository.delete({
            id: allCompMarker[markerIndex].id,
          });
        }
      }
    }

    var markerData = await this.venueContentMarkersRepository.update(
      marker.id,
      venueMarker,
    );

    if (marker.media_data) {
      let markerDetails = marker.media_data[0];
      for (var i = 0; i < markerDetails.length; i++) {
        let order = i + 1;
        var image = markerDetails[i];
        if (image.image) {
          let path = saveBase64Image(image.image, 'image');
          if (path) {
            let mediaGallery = new MediaGallery();
            mediaGallery.user_id = user.id;
            mediaGallery.name = path;
            mediaGallery.alt_name = image.caption;
            mediaGallery.media_name = image.media_name;
            mediaGallery.type = 'image';
            let media = await this.mediaRepository.save(mediaGallery);
            let markerMedia = new VenueMarkerMedia();
            markerMedia.venue_marker_id = marker.id;
            markerMedia.media_id = media.id;
            markerMedia.order = order;
            let gallary = await this.venueMarkerMediaRepository.save(
              markerMedia,
            );
          }
        } else if (image.media_id) {
          let markerMedia = new VenueMarkerMedia();
          markerMedia.order = order;
          await this.venueMarkerMediaRepository.update(
            {
              venue_marker_id: image.venue_marker_id,
              media_id: image.media_id,
            },
            markerMedia,
          );
        } else {
          let markerMedia = new VenueMarkerMedia();
          markerMedia.order = order;
          markerMedia.venue_marker_id = marker.id;
          markerMedia.media_id = image.id;
          await this.venueMarkerMediaRepository.save(markerMedia);
        }
      }
    }
    let response = await this.getContentMarkers(marker.id);
    return response;
  }

  async deleteMarkerMedia(markerMediaId) {
    var res = await this.venueMarkerMediaRepository.delete({
      id: markerMediaId,
    });
    return res;
  }

  async deleteMarker(markerId) {
    var res = await this.venueContentMarkersRepository.delete({ id: markerId });
    return res;
  }

  async addNearByVenues(venueId, venue, order) {
    let nearByVenue = new NearByVenue();
    nearByVenue.order = order;
    nearByVenue.yaw = venue.yaw;
    nearByVenue.pitch = venue.pitch;
    nearByVenue.venue_hotspot_name = venue.venue_hotspot_name;

    let find = await this.nearByVenueRepository.findOne({
      venue_id: venueId,
      near_by_venue_id: venue.id,
    });
    if (find) {
      await this.nearByVenueRepository.update(find.id, nearByVenue);
    } else {
      nearByVenue.venue_id = venueId;
      nearByVenue.near_by_venue_id = venue.id;
      await this.nearByVenueRepository.save(nearByVenue);
    }
  }

  async moveThumnailImage(path) {
    var filePath = path + '/thumb.jpg';
    var timestamp = Math.floor(Date.now() / 1000);
    var fileName = timestamp + '.jpg';
    var newPath = 'public/panorama/' + fileName;
    fs.rename(filePath, newPath, function(err) {
      if (err) throw err;
    });
    return fileName;
  }

  async copyTiles(source, destination) {
    ncp(source, destination, function(err) {
      if (err) {
        return err;
      }
      return true;
    });
  }

  async updateVenueXmlInfoMarkers(payload) {
    var currentVenueTile =
      'public/cube/' + payload.tileUrl + '/' + payload.xmlpath;

    const xmlFile = fs.readFileSync(currentVenueTile, 'utf8');

    const jsonData = JSON.parse(
      convert.xml2json(xmlFile, { compact: true, spaces: 4 }),
    );

    var venueHotSpotInfo = payload.hotspotInfo;

    var contentMarker = new VenueContentMarkers();
    let markerName = [];
    if (payload.markers) {
      contentMarker.information_marker_1 = payload.markers.information_marker_1;
      contentMarker.information_marker_2 = payload.markers.information_marker_2;
      contentMarker.information_marker_3 = payload.markers.information_marker_3;
      contentMarker.information_marker_4 = payload.markers.information_marker_4;
      contentMarker.information_marker_5 = payload.markers.information_marker_5;
      contentMarker.information_marker_1_name =
        payload.markers.information_marker_1_name;

      contentMarker.information_marker_2_name =
        payload.markers.information_marker_2_name;

      contentMarker.information_marker_3_name =
        payload.markers.information_marker_3_name;

      contentMarker.information_marker_4_name =
        payload.markers.information_marker_4_name;

      contentMarker.information_marker_5_name =
        payload.markers.information_marker_5_name;

      let array1 = await this.venueContentMarkersRepository
        .createQueryBuilder('venue_content_markers')
        .where('venue_content_markers.id=:id', { id: payload.markers.id })
        .withDeleted()
        .getMany();

      await this.venueContentMarkersRepository.update(
        payload.markers.id,
        contentMarker,
      );
      let array2 = await this.venueContentMarkersRepository
        .createQueryBuilder('venue_content_markers')
        .where('venue_content_markers.id=:id', { id: payload.markers.id })
        .withDeleted()
        .getMany();

      for (let i = 0; i < array1.length; i++) {
        if (
          array1[i].information_marker_1_name != '' &&
          array2[i].information_marker_1_name == ''
        ) {
          markerName.push(array1[i].information_marker_1_name.toLowerCase());
        }

        if (
          array1[i].information_marker_2_name != '' &&
          array2[i].information_marker_2_name == ''
        ) {
          markerName.push(array1[i].information_marker_2_name.toLowerCase());
        }

        if (
          array1[i].information_marker_3_name != '' &&
          array2[i].information_marker_3_name == ''
        ) {
          markerName.push(array1[i].information_marker_3_name.toLowerCase());
        }

        if (
          array1[i].information_marker_4_name != '' &&
          array2[i].information_marker_4_name == ''
        ) {
          markerName.push(array1[i].information_marker_4_name.toLowerCase());
        }

        if (
          array1[i].information_marker_5_name != '' &&
          array2[i].information_marker_5_name == ''
        ) {
          markerName.push(array1[i].information_marker_5_name.toLowerCase());
        }
      }
    }
    console.log(venueHotSpotInfo);
    var hotspotArrData = [];
    console.log(markerName, 'markerName');
    for (let i = 0; i <= markerName.length; i++) {
      console.log(markerName[i]);
      const arr = venueHotSpotInfo.find(el => el.name === markerName[i]);
      console.log(arr, 'arr===');

      let index =
        arr && venueHotSpotInfo.findIndex(element => element.name == arr.name);
      console.log('index', index);
      if (index && index !== -1) {
        venueHotSpotInfo.splice(index, 1);
      }
      // index !== -1 &&
    }
    console.log(venueHotSpotInfo);

    for (let i = 0; i < venueHotSpotInfo.length; i++) {
      hotspotArrData.push({
        _attributes: {
          name: venueHotSpotInfo[i].name,
          url: venueHotSpotInfo[i].url,
          ath: venueHotSpotInfo[i].ath,
          atv: venueHotSpotInfo[i].atv,
          rotate: venueHotSpotInfo[i].rotate,
          scale: venueHotSpotInfo[i].scale,
          dragging: venueHotSpotInfo[i].dragging,
          zoom: venueHotSpotInfo[i].zoom,
          renderer: venueHotSpotInfo[i].renderer,
          edge: venueHotSpotInfo[i].edge,
          x: venueHotSpotInfo[i].x,
          y: venueHotSpotInfo[i].y,
        },
      });
    }

    jsonData.krpano.scene['hotspot'] = hotspotArrData;
    var jsonString = JSON.stringify(jsonData);
    var convertedXml = convert.json2xml(jsonString, {
      compact: true,
      spaces: 4,
    });

    fs.writeFile(currentVenueTile, convertedXml, 'utf8', function(err) {
      if (err) {
        console.log(err);
        return err;
      } else {
        console.log('Xml updated succesfully!');
      }
      console.log('The file was saved!');
    });
    return markerName;
  }
}
