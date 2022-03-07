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
import { StopTourCategory } from 'src/modules/entity/stop_tour_category.entity';
import { Stop } from 'src/modules/entity/stops.entity';
import { StopVenue } from 'src/modules/entity/stop_venues.entity';
import { StopPois } from 'src/modules/entity/stop_pois.entity';
import { NearByStop } from 'src/modules/entity/near_by_stop.entity';
import { Tours } from 'src/modules/entity/tours.entity';
import * as fs from 'fs';
import * as unzipper from 'unzipper';
import * as ncp from 'ncp';
import { exec } from 'child_process';
import { execSync } from 'child_process';
import { ConfigService } from '@nestjs/config';
import { xml2js } from 'xml-js';
import { StopContentMarkers } from 'src/modules/entity/stop_content_marker.entity';
import { StopMarkerMedia } from 'src/modules/entity/stop_marker_media.entity';
import { StopBeforeAfterMedia } from 'src/modules/entity/stop_before_after_media.entity';

var convert = require('xml-js');

@Injectable()
export class StopsService {
  private configService: any;
  tileurl: any;

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
    @InjectRepository(PoiCategories)
    private readonly poiCategoryRepository: Repository<PoiCategories>,
    @InjectRepository(PoiDetails)
    private readonly poiDetailsRepository: Repository<PoiDetails>,
    @InjectRepository(Stop) private readonly stopRepository: Repository<Stop>,
    @InjectRepository(MediaGallery)
    private readonly mediaRepository: Repository<MediaGallery>,
    @InjectRepository(StopTourCategory)
    private readonly stopTourCategoryRepository: Repository<StopTourCategory>,
    @InjectRepository(StopVenue)
    private readonly stopVenueRepository: Repository<StopVenue>,
    @InjectRepository(StopPois)
    private readonly stopPoisRepository: Repository<StopPois>,
    @InjectRepository(NearByStop)
    private readonly nearByStopRepository: Repository<NearByStop>,
    @InjectRepository(Tours)
    private readonly toursRepository: Repository<Tours>,
    @InjectRepository(StopContentMarkers)
    private readonly stopContentMarkerRepository: Repository<
      StopContentMarkers
    >,
    @InjectRepository(StopMarkerMedia)
    private readonly stopMarkerMediaRepository: Repository<StopMarkerMedia>,
    @InjectRepository(StopBeforeAfterMedia)
    private readonly stopBeforeAfterMediaRepository: Repository<
      StopBeforeAfterMedia
    >,
  ) {
    this.configService = new ConfigService();
  }

  async getStopList(request): Promise<any> {
    let input = request.query;
    let userData = request.user;
    const query = await this.stopRepository
      .createQueryBuilder('stops')

      .leftJoinAndSelect('stops.panorama', 'panorama')
      .leftJoinAndSelect('stops.streetPhoto', 'streetPhoto');

    if (input.sortBy && input.sortBy != '') {
      let orderDirection: any = input.sortDesc == 'true' ? 'DESC' : 'ASC';
      console.log('input.sortBy', input.sortBy);
      console.log('orderDirection', orderDirection);
      query.orderBy(`stops.${input.sortBy}`, orderDirection);
    } else {
      query.orderBy('stops.id', 'DESC');
    }

    if (request.user.roles[0].name != 'admin') {
      query.andWhere('(stops.user_id = :id OR stops.assigned_user = :id)', {
        id: userData.id,
      });
    }

    if (input.search && input.search != '') {
      query.andWhere(`stops.name LIKE :search`, {
        search: `%${input.search}%`,
      });
    }

    if (input.id && input.id != '') {
      query.andWhere('stops.id != :id', { id: input.id });
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
      query.andWhere('stops.deleted_at != ""');
    }

    let response = await new Pagination(query, Stop, isActive).paginate(
      limit,
      page,
    );

    for (var i = 0; i < response['data'].length; i++) {
      var data = response['data'][i];

      const stops = await this.stopRepository
        .createQueryBuilder('stops')
        .leftJoinAndSelect('stops.tours', 'tours')
        .where('stops.id = :id', { id: data.id })
        .withDeleted()
        .getOne();

      var tourCount = stops.tours.length;
      response['data'][i]['tourCount'] = tourCount ? tourCount : '-';
    }

    return response;
  }

  async deleteStop(id): Promise<any> {
    var res = await this.stopRepository.softDelete({ id: id });
    return res;
  }

  async restore(input: any) {
    var res = await this.stopRepository.restore({ id: input.id });
    return res;
  }

  async getStopDetail(id, user) {
    try {
      let response = await this.stopRepository
        .createQueryBuilder('stops')
        .leftJoinAndSelect('stops.panorama', 'panorama')
        .leftJoinAndSelect('stops.streetPhoto', 'streetPhoto')
        .leftJoinAndSelect('stops.stopVenue', 'stopVenue')
        .leftJoinAndSelect('stopVenue.venues', 'venues')
        .leftJoinAndSelect('stops.panorama', 'stop_panorama')
        .leftJoinAndSelect('stops.stopPois', 'stopPois')
        .leftJoinAndSelect('stopPois.poiDetails', 'poiDetails')
        .leftJoinAndSelect('poiDetails.poiMedia', 'poiMedia')
        .leftJoinAndSelect('poiMedia.mediaGallery', 'mediaGallery')
        .leftJoinAndSelect('poiDetails.categories', 'poiCategories')
        .leftJoinAndSelect('venues.streetPhoto', 'venues_streetPhoto')
        .leftJoinAndSelect('stops.nearByStop', 'nearByStop')
        .leftJoinAndSelect('nearByStop.stopDetail', 'stopDetail')
        .leftJoinAndSelect('stopDetail.streetPhoto', 'stopDetailstreetPhoto')
        .leftJoinAndSelect('stops.stopContentMarkers', 'stopContentMarkers')
        .leftJoinAndSelect('stopContentMarkers.marker', 'marker')
        .leftJoinAndSelect(
          'stopContentMarkers.stopBeforeAfterMedia',
          'stopBeforeAfterMedia',
        )
        .leftJoinAndSelect(
          'stopBeforeAfterMedia.mediaBeforeGallery',
          'mediaBeforeGallery',
        )
        .leftJoinAndSelect(
          'stopBeforeAfterMedia.mediaAfterGallery',
          'mediaAfterGallery',
        )
        .leftJoinAndSelect(
          'stopContentMarkers.stopMarkerMedia',
          'stopMarkerMedia',
        )
        .leftJoinAndSelect('stopMarkerMedia.mediaGallery', 'stopMediaGallery')

        .where('stops.id = :id', { id: id })
        .withDeleted()
        .getOne();

      if (
        user.roles[0].name != 'admin' &&
        response.user_id != user.id &&
        response.assigned_user != user.id
      ) {
        throw new Error('Not authorised');
      }

      if (response.stopContentMarkers && response.stopContentMarkers.length) {
        for (var i = 0; i < response.stopContentMarkers.length; i++) {
          let stopMarker = response.stopContentMarkers[i];
          if (
            stopMarker.marker.name == 'image' ||
            stopMarker.marker.name == 'feature'
          ) {
            stopMarker.stopMarkerMedia.sort(function(a, b) {
              if (a.order < b.order) return -1;
              if (a.order > b.order) return 1;
              return 0;
            });
          }
        }
      }

      if (response.stopVenue) {
        response.stopVenue.sort(function(a, b) {
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

  async createStop(payload, user): Promise<any> {
    try {
      let stop = new Stop();

      if (payload.name) {
        stop.name = payload.name;
      }

      if (payload.description) {
        stop.description = payload.description;
      }

      if (payload.url) {
        stop.url = payload.url;
      }

      if (payload.latitude) {
        stop.latitude = payload.latitude;
      }

      if (payload.longitude) {
        stop.longitude = payload.longitude;
      }

      if (payload.zoom_level) {
        stop.zoom_level = payload.zoom_level;
      }

      if (payload.yaw) {
        stop.yaw = payload.yaw;
      }

      if (payload.pitch) {
        stop.pitch = payload.pitch;
      }

      if (payload.assigned_user) {
        stop.assigned_user = payload.assigned_user;
      }

      if (payload.user_permission) {
        stop.user_permission = payload.user_permission;
      }

      if (payload.fov) {
        stop.fov = payload.fov;
      }

      if (payload.roll) {
        stop.roll = payload.roll;
      }

      if (payload.metatitle) {
        stop.meta_title = payload.metatitle;
      }

      if (payload.metadesc) {
        stop.meta_desc = payload.metadesc;
      }

      if (payload.stop_image_id) {
        stop.street_photo_id = payload.stop_image_id;
      }

      if (payload.metatitle) {
        stop.meta_title = payload.metatitle;
      }

      if (payload.metadesc) {
        stop.meta_desc = payload.metadesc;
      }

      if (payload.stop_image) {
        let path = saveBase64Image(payload.stop_image, 'thumbnail');
        if (path) {
          let mediaGallery = new MediaGallery();
          mediaGallery.user_id = user.id;
          mediaGallery.name = path;
          mediaGallery.alt_name = payload.name;
          mediaGallery.media_name = payload.stop_image_name;
          mediaGallery.type = 'thumbnail';
          let media = await this.mediaRepository.save(mediaGallery);
          stop.street_photo_id = media.id;
        }
      }
      if (payload.street_photo_id) {
        stop.street_photo_id = payload.street_photo_id;
      }

      if (payload.panorama_image_id) {
        payload.selectMedia = true;
      }

      if (payload.panorama_image_id) {
        stop.panorama_image_id = payload.panorama_image_id;
      }

      if (payload.id) {
        let find = await this.stopRepository
          .createQueryBuilder('stops')
          .where('stops.id != :id', { id: payload.id })
          .andWhere('slug = :slug', { slug: payload.slug })
          .withDeleted()
          .getOne();
        if (find) {
          throw new Error('This slug is already in use.');
        }
        stop.slug = payload.slug;
        var data = await this.stopRepository.update(payload.id, stop);
      } else {
        let find = await this.stopRepository
          .createQueryBuilder('stops')
          .where('slug = :slug', { slug: payload.slug })
          .withDeleted()
          .getOne();
        if (find) {
          throw new Error('This slug is already in use.');
        }
        console.log('stop', stop);

        stop.slug = payload.slug;
        stop.user_id = user.id;
        let data = await this.stopRepository.save(stop);
        payload.id = data.id;
        this.updateUniuqName(payload.id);
      }

      if (payload.selectMedia) {
        let find = await this.mediaRepository
          .createQueryBuilder('media_gallery')
          .where('id = :id', { id: payload.panorama_image_id })
          .getOne();

        if (find) {
          var cube_url = find.cube_url;
          this.tileurl = 'public/cube/' + cube_url;
          console.log('url', this.tileurl);
        }
      }

      if (payload.panorama_image || payload.tile_name) {
        let mediaGallery = new MediaGallery();
        mediaGallery.cube_url = payload.cube_url;
        console.log('mediaGalleryy', payload.panorama_image_id);
        await this.mediaRepository.update(
          payload.panorama_image_id,
          mediaGallery,
        );
      }

      if (payload.tour_categories) {
        await this.stopTourCategoryRepository.delete({ stop_id: payload.id });
        payload.tour_categories.forEach(async id => {
          await this.addStopTourCategory(payload.id, id);
        });
      }

      let insertedVenue = [];
      if (payload.venues) {
        let venues = payload.venues;
        for (var i = 0; i < venues.length; i++) {
          insertedVenue.push(venues[i].id);
          let order = i + 1;
          await this.addVenueStops(payload.id, venues[i], order);
        }

        var allCompMarker = await this.stopVenueRepository
          .createQueryBuilder('stop_venues')
          .where('stop_id = :id', { id: payload.id })
          .getMany();

        for (
          var markerIndex = 0;
          markerIndex < allCompMarker.length;
          markerIndex++
        ) {
          if (
            insertedVenue.indexOf(allCompMarker[markerIndex].venue_id) == -1
          ) {
            await this.stopVenueRepository.delete({
              id: allCompMarker[markerIndex].id,
            });
          }
        }
      }
      if (payload.remove_marker_on_edit == 1) {
        await this.stopContentMarkerRepository.delete({
          stop_id: payload.id,
        });
      }

      if (payload.markers) {
        payload.markers.forEach(async marker => {
          await this.addStopMarkers(payload.id, marker, user.id);
        });
      }
      if (payload.pois) {
        await this.stopPoisRepository.delete({ stop_id: payload.id });
        payload.pois.forEach(async poi => {
          await this.addStopPois(payload.id, poi);
        });
      }

      if (payload.stops) {
        await this.nearByStopRepository.delete({ stop_id: payload.id });
        payload.stops.forEach(async stop => {
          await this.addNearByStops(payload.id, stop);
        });
      }

      if (payload.hotspotInfo || payload.initialViewInfo) {
        await this.updateStopXml(
          payload.hotspotInfo,
          this.tileurl,
          payload.initialViewInfo,
          payload.id,
        );
      }

      let response = await this.getStopDetail(payload.id, user);
      return response;
    } catch (error) {
      throw error;
    }
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

  async addStopTourCategory(stopId, categoryId) {
    let stopCategory = new StopTourCategory();
    stopCategory.stop_id = stopId;
    stopCategory.category_id = categoryId;
    await this.stopTourCategoryRepository.save(stopCategory);
  }

  async updateUniuqName(id) {
    var name = 'S' + id;
    let stop = new Stop();
    stop.unique_name = name;
    await this.stopRepository.update(id, stop);
    return true;
  }

  async addVenueStops(stopId, venue, order) {
    console.log(venue, 'venue log');
    let venueStops = new StopVenue();
    venueStops.order = order;
    venueStops.yaw = venue.yaw;//ath
    venueStops.pitch = venue.pitch;//atv
    venueStops.position = venue.position;
    venueStops.venue_hotspot_name = venue.venue_hotspot_name;

    let find = await this.stopVenueRepository.findOne({
      venue_id: venue.id,
      stop_id: stopId,
    });
    if (find) {
      await this.stopVenueRepository.update(find.id, venueStops);
    } else {
      venueStops.venue_id = venue.id;
      venueStops.stop_id = stopId;
      await this.stopVenueRepository.save(venueStops);
    }
  }

  async addStopPois(stopId, poi) {
    let stopPoi = new StopPois();
    stopPoi.stop_id = stopId;
    stopPoi.poi_id = poi.id;
    stopPoi.poi_hotspot_name = poi.poi_hotspot_name;
    stopPoi.yaw = poi.yaw;
    stopPoi.pitch = poi.pitch;
    await this.stopPoisRepository.save(stopPoi);
  }

  async addNearByStops(stopId, stop) {
    let nearByStop = new NearByStop();
    nearByStop.stop_id = stopId;
    nearByStop.near_by_stop_id = stop.id;
    nearByStop.video = stop.video;
    nearByStop.stop_hotspot_name = stop.stop_hotspot_name;
    nearByStop.yaw = stop.yaw;
    nearByStop.pitch = stop.pitch;
    await this.nearByStopRepository.save(nearByStop);
  }

  async updateStopXml(stopHotSpotInfo, tileurl, intitialViewInfo, stopId) {
    var currentStopTile = tileurl + '/tour.xml';
    var configUrl =
    this.configService.get('APP_URL')
    console.log('edit ID', stopId);

    console.log('currentStopTile', currentStopTile);
    const xmlFile = fs.readFileSync(currentStopTile, 'utf8');

    const jsonData = JSON.parse(
      convert.xml2json(xmlFile, { compact: true, spaces: 4 }),
    );

    var hotspotArrData = [];
    for (let i = 0; i < stopHotSpotInfo.length; i++) {
      hotspotArrData.push({
        _attributes: {
          name: stopHotSpotInfo[i].name,
          url: configUrl + '/public/markers/images.png',
          ath: stopHotSpotInfo[i].ath,
          atv: stopHotSpotInfo[i].atv,
          rotate: stopHotSpotInfo[i].rotate,
          scale: stopHotSpotInfo[i].scale,
          dragging: stopHotSpotInfo[i].dragging,
          zoom: stopHotSpotInfo[i].zoom,
          renderer: stopHotSpotInfo[i].renderer,
          edge: stopHotSpotInfo[i].edge,
          x: stopHotSpotInfo[i].x,
          y: stopHotSpotInfo[i].y,
          id: stopHotSpotInfo[i].hotspotId,
        },
      });
    }

    console.log('intitialViewInfo' ,intitialViewInfo);
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

    var stopXml = 'stop_' + stopId + '.xml';
    const newStopXmlFile = tileurl + '/' + stopXml;

    console.log('newStopXmlFile', newStopXmlFile);

    fs.writeFile(newStopXmlFile, convertedXml, 'utf8', function(err) {
      if (err) {
        console.log(err);
        return err;
      } else {
        console.log('Xml updated succesfully!');
      }
      console.log('The file was saved!');
    });

    let stop = new Stop();
    stop.xmlfile_path = stopXml; //update KRpano XML file path name in venues table
    await this.stopRepository.update(stopId, stop);
  }

  async updateLocation(payload, user) {
    let stop = new Stop();
    stop.latitude = payload.latitude;
    stop.longitude = payload.longitude;
    let res = await this.stopRepository.update(payload.id, stop);
    return res;
  }

  async uploadTile(req, user, file) {
    try {
      console.log();
      var timestamp = Math.floor(Date.now() / 1000);
      var path = file.destination + '/' + timestamp;
      var result = await this.generateTiles(req, user, file, timestamp, path);
      console.log('======console11=======');
      return result;
      return timestamp;
    } catch (error) {
      throw error;
    }
  }

  async generateTiles(req, user, file, timestamp, path) {
    var that = this;
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
      var filePath = file.destination + '/' + file.filename;
      var newPath = path + '/' + timestamp + '.jpeg';

      fs.renameSync(filePath, newPath);

      var configUrl =
        this.configService.get('KRPANO_URL') +
        'templates/vtour-multires.config';
      var panoUrl = timestamp + '.jpeg';

      var krpanoUrl = this.configService.get('KRPANO_URL') + 'krpanotools';
      execSync(
        `cd ${path} && ${krpanoUrl} makepano -config=${configUrl} ${panoUrl}`,
      );

      return timestamp;
    } else {
      return false;
    }
  }

  async addStopMarkers(venueId, marker, userId) {
    console.log('inside add venue marker', marker.hotspot_marker_name);
    let stopMarker = new StopContentMarkers();
    stopMarker.stop_id = venueId;
    stopMarker.marker_id = marker.marker_id;
    stopMarker.hotspot_marker_name = marker.hotspot_marker_name;

    stopMarker.information_marker_1 = marker.information_marker_1;
    stopMarker.information_marker_1_name = marker.information_marker_1_name;
    stopMarker.information_marker_2 = marker.information_marker_2;
    stopMarker.information_marker_2_name = marker.information_marker_2_name;
    stopMarker.information_marker_3 = marker.information_marker_3;
    stopMarker.information_marker_3_name = marker.information_marker_3_name;
    stopMarker.information_marker_4 = marker.information_marker_4;
    stopMarker.information_marker_4_name = marker.information_marker_4_name;
    stopMarker.information_marker_5 = marker.information_marker_5;
    stopMarker.information_marker_5_name = marker.information_marker_5_name;

    stopMarker.video_link = marker.video_link;
    stopMarker.name = marker.name;
    stopMarker.description = marker.description;
    stopMarker.address = marker.address;
    stopMarker.offer_text = marker.offer_text;
    stopMarker.offer_url = marker.offer_url;
    stopMarker.website = marker.website;
    var markerData = await this.stopContentMarkerRepository.save(stopMarker);

    //return false;

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
        let markerMedia = new StopBeforeAfterMedia();
        markerMedia.stop_marker_id = markerData.id;

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

        let gallary = await this.stopBeforeAfterMediaRepository.save(
          markerMedia,
        );
        //await this.addPoiMedia(payload.id,media.id);
      }
    }

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
            let markerMedia = new StopMarkerMedia();
            markerMedia.stop_marker_id = markerData.id;
            markerMedia.media_id = media.id;
            markerMedia.order = order;
            let gallary = await this.stopMarkerMediaRepository.save(
              markerMedia,
            );
            //await this.addPoiMedia(payload.id,media.id);
          }
        } else if (image.select_media_id) {
          let order = i + 1;
          let markerMedia = new StopMarkerMedia();
          markerMedia.order = order;
          markerMedia.stop_marker_id = markerData.id;
          markerMedia.media_id = image.id;
          await this.stopMarkerMediaRepository.save(markerMedia);
        }
      }
    }

    return markerData;
  }
  async editMarker(marker, user) {
    let stopMarker = new StopContentMarkers();
    console.log('stop');

    stopMarker.stop_id = marker.stop_id;
    stopMarker.marker_id = marker.marker_id;

    stopMarker.information_marker_1 = marker.information_marker_1;
    stopMarker.information_marker_1_name = marker.information_marker_1_name;
    stopMarker.information_marker_2 = marker.information_marker_2;
    stopMarker.information_marker_2_name = marker.information_marker_2_name;
    stopMarker.information_marker_3 = marker.information_marker_3;
    stopMarker.information_marker_3_name = marker.information_marker_3_name;

    stopMarker.information_marker_4 = marker.information_marker_4;
    stopMarker.information_marker_4_name = marker.information_marker_4_name;

    stopMarker.information_marker_5 = marker.information_marker_5;
    stopMarker.information_marker_5_name = marker.information_marker_5_name;

    stopMarker.video_link = marker.video_link;
    stopMarker.name = marker.name;
    stopMarker.description = marker.description;
    stopMarker.address = marker.address;
    stopMarker.offer_text = marker.offer_text;
    stopMarker.offer_url = marker.offer_url;
    stopMarker.website = marker.website;

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
              let markerMedia = new StopBeforeAfterMedia();
              markerMedia.before_image_id = media.id;

              await this.stopBeforeAfterMediaRepository.update(
                formDetail.id,
                markerMedia,
              );
            }
          } else if (beforImageId) {
            let markerMedia = new StopBeforeAfterMedia();
            markerMedia.before_image_id = beforImageId;
            await this.stopBeforeAfterMediaRepository.update(
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
              let markerMedia = new StopBeforeAfterMedia();
              markerMedia.after_image_id = afterMedia.id;
              await this.stopBeforeAfterMediaRepository.update(
                formDetail.id,
                markerMedia,
              );
            }
          } else if (afterImageId) {
            console.log('in datasdasdasdasdsad' ,afterImageId);
            let markerMedia = new StopBeforeAfterMedia();
            markerMedia.after_image_id = afterImageId;
            await this.stopBeforeAfterMediaRepository.update(
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

            let markerMedia = new StopBeforeAfterMedia();
            console.log(media.id , afterMedia.id);
            markerMedia.stop_marker_id = marker.id;
            markerMedia.before_image_id = beforImageId;
            markerMedia.after_image_id  = afterImageId;
            let comparisonData = await this.stopBeforeAfterMediaRepository.save(
              markerMedia,
            );

            insertedData.push(comparisonData.id);
          }
        }
      }
      var allCompMarker = await this.stopBeforeAfterMediaRepository
        .createQueryBuilder('stop_before_after_media')
        .where('stop_marker_id = :id', { id: marker.id })
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
          await this.stopBeforeAfterMediaRepository.delete({
            id: allCompMarker[markerIndex].id,
          });
        }
      }
    }

    var markerData = await this.stopContentMarkerRepository.update(
      marker.id,
      stopMarker,
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
            let markerMedia = new StopMarkerMedia();
            markerMedia.stop_marker_id = marker.id;
            markerMedia.media_id = media.id;
            markerMedia.order = order;
            let gallary = await this.stopMarkerMediaRepository.save(
              markerMedia,
            );
          }
        } else if (image.media_id) {
          let markerMedia = new StopMarkerMedia();
          markerMedia.order = order;
          await this.stopMarkerMediaRepository.update(
            {
              stop_marker_id: image.stop_marker_id,
              media_id: image.media_id,
            },
            markerMedia,
          );
        } else {
          let markerMedia = new StopMarkerMedia();
          markerMedia.order = order;
          markerMedia.stop_marker_id = marker.id;
          markerMedia.media_id = image.id;
          await this.stopMarkerMediaRepository.save(markerMedia);
        }
      }
    }
    let response = await this.getContentMarkers(marker.id);
    return response;
  }

  async getContentMarkers(id) {
    let response = await this.stopContentMarkerRepository
      .createQueryBuilder('stopContentMarkers')
      .leftJoinAndSelect('stopContentMarkers.marker', 'marker')
      .leftJoinAndSelect(
        'stopContentMarkers.beforImageDetail',
        'beforImageDetail',
      )
      .leftJoinAndSelect(
        'stopContentMarkers.afterImageDetail',
        'afterImageDetail',
      )
      .leftJoinAndSelect(
        'stopContentMarkers.stopMarkerMedia',
        'stopMarkerMedia',
      )
      .leftJoinAndSelect('stopMarkerMedia.mediaGallery', 'mediaGallery')
      .leftJoinAndSelect(
        'stopContentMarkers.stopBeforeAfterMedia',
        'stopBeforeAfterMedia',
      )
      .leftJoinAndSelect(
        'stopBeforeAfterMedia.mediaBeforeGallery',
        'mediaBeforeGallery',
      )
      .leftJoinAndSelect(
        'stopBeforeAfterMedia.mediaAfterGallery',
        'mediaAfterGallery',
      )
      .where('stopContentMarkers.id = :id', { id: id })
      .withDeleted()
      .getOne();

    return response;
  }

  async deleteMarker(markerId) {
    var res = await this.stopContentMarkerRepository.delete({ id: markerId });
    return res;
  }

  async deleteMarkerMedia(markerMediaId) {
    var res = await this.stopMarkerMediaRepository.delete({
      id: markerMediaId,
    });
    return res;
  }

  async updateVenueXmlInfoMarkers(payload) {
    var currentStopTile =
      'public/cube/' + payload.tileUrl + '/' + payload.xmlpath;

    const xmlFile = fs.readFileSync(currentStopTile, 'utf8');

    const jsonData = JSON.parse(
      convert.xml2json(xmlFile, { compact: true, spaces: 4 }),
    );

    var stopHotSpotInfo = payload.hotspotInfo;

    var contentMarker = new StopContentMarkers();
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

      //uncomment this after check
      let array1 = await this.stopContentMarkerRepository
        .createQueryBuilder('stop_content_markers')
        .where('stop_content_markers.id=:id', { id: payload.markers.id })
        .withDeleted()
        .getMany();

      await this.stopContentMarkerRepository.update(
        payload.markers.id,
        contentMarker,
      );
      let array2 = await this.stopContentMarkerRepository
        .createQueryBuilder('stop_content_markers')
        .where('stop_content_markers.id=:id', { id: payload.markers.id })
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
    console.log(stopHotSpotInfo);
    var hotspotArrData = [];
    console.log(markerName, 'markerName');
    for (let i = 0; i <= markerName.length; i++) {
      console.log(markerName[i]);
      const arr = stopHotSpotInfo.find(el => el.name === markerName[i]);
      console.log(arr, 'arr===');

      let index =
        arr && stopHotSpotInfo.findIndex(element => element.name == arr.name);
      console.log('index', index);
      if (index && index !== -1) {
        stopHotSpotInfo.splice(index, 1);
      }
      // index !== -1 &&
    }
    console.log(stopHotSpotInfo);

    for (let i = 0; i < stopHotSpotInfo.length; i++) {
      hotspotArrData.push({
        _attributes: {
          name: stopHotSpotInfo[i].name,
          url: stopHotSpotInfo[i].url,
          ath: stopHotSpotInfo[i].ath,
          atv: stopHotSpotInfo[i].atv,
          rotate: stopHotSpotInfo[i].rotate,
          scale: stopHotSpotInfo[i].scale,
          dragging: stopHotSpotInfo[i].dragging,
          zoom: stopHotSpotInfo[i].zoom,
          renderer: stopHotSpotInfo[i].renderer,
          edge: stopHotSpotInfo[i].edge,
          x: stopHotSpotInfo[i].x,
          y: stopHotSpotInfo[i].y,
        },
      });
    }

    jsonData.krpano.scene['hotspot'] = hotspotArrData;
    var jsonString = JSON.stringify(jsonData);
    var convertedXml = convert.json2xml(jsonString, {
      compact: true,
      spaces: 4,
    });

    fs.writeFile(currentStopTile, convertedXml, 'utf8', function(err) {
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
