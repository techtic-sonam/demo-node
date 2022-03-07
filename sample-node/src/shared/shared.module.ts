import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/modules/entity/user.entity';
import { Services } from './services';
import { UserHasRole } from 'src/modules/entity/userHasRole.entity';
import { Role } from 'src/modules/entity/role.entity';
import { Setting } from 'src/modules/entity/settings.entity';
import { PoiCategories } from 'src/modules/entity/poi_cetgory.entity';
import { PoiDetails } from 'src/modules/entity/poi_details.entity';
import { MediaGallery } from 'src/modules/entity/media_gallery.entity';
import { PoiMedia } from 'src/modules/entity/poi_media.entity';
import { Country } from 'src/modules/entity/country.entity';
import { State } from 'src/modules/entity/state.entity';
import { Markers } from 'src/modules/entity/markers.entity';
import { Venues } from 'src/modules/entity/venues.entity';
import { VenueContentMarkers } from 'src/modules/entity/venue_content_markers.entity';
import { TourCategory } from 'src/modules/entity/tour_category.entity';
import { PoiTourCategory } from 'src/modules/entity/poi_tour_category.entity';
import { Tours } from 'src/modules/entity/tours.entity';
import { Stop } from 'src/modules/entity/stops.entity';
import { VenueTourCategory } from 'src/modules/entity/venue_tour_category.entity';
import { StopVenue } from 'src/modules/entity/stop_venues.entity';
import { VenueMarkerMedia } from 'src/modules/entity/venue_marker_media.entity';
import { VenuePoi } from 'src/modules/entity/venue_poi.entity';
import { StopTourCategory } from 'src/modules/entity/stop_tour_category.entity';
import { StopPois } from 'src/modules/entity/stop_pois.entity';
import { NearByStop } from 'src/modules/entity/near_by_stop.entity';
import { TourHasCategories } from 'src/modules/entity/tour_has_category.entity';
import { TourStops } from 'src/modules/entity/tour_stops.entity';
import { NearByVenue } from 'src/modules/entity/near_by_venues.entity';
import { TourEmbededWebsite } from 'src/modules/entity/tour_emeded_website.entity';
import { TourMarketOverview } from 'src/modules/entity/tour_market_overview.entity';
import { VenueBeforeAfterMedia } from 'src/modules/entity/venue_before_after_media.entity';
import { AppGateway } from '../app.gateway';
import { StopMarkerMedia } from 'src/modules/entity/stop_marker_media.entity';
import { StopContentMarkers } from 'src/modules/entity/stop_content_marker.entity';
import { StopBeforeAfterMedia } from 'src/modules/entity/stop_before_after_media.entity';
import { EulaAgreement } from 'src/modules/entity/eula_agreement.entity';
import { UserEulaAgreement } from 'src/modules/entity/user_eula_agreement.entity';


const Entity = [
    User,
    UserHasRole,
    Role,
    Setting,
    PoiCategories,
    PoiDetails,
    MediaGallery,
    PoiMedia,
    Country,
    State,
    Markers,
    Venues,
    VenueContentMarkers,
    TourCategory,
    PoiTourCategory,
    Tours,
    Stop,
    VenueTourCategory,
    StopVenue,
    VenueMarkerMedia,
    VenuePoi,
    StopTourCategory,
    StopPois,
    NearByStop,
    NearByVenue,
    TourHasCategories,
    TourStops,
    TourEmbededWebsite,
    TourMarketOverview,
    VenueBeforeAfterMedia,
    StopMarkerMedia,
    StopContentMarkers,
    StopBeforeAfterMedia,
    EulaAgreement,
    UserEulaAgreement

 ];

@Module({
  imports: [TypeOrmModule.forFeature(Entity)],
  exports: [...Services, TypeOrmModule.forFeature(Entity)],
  providers: [...Services, AppGateway],
})
export class SharedModule {
  static forRoot(): DynamicModule {
    return {
      module: SharedModule,
      providers: [...Services],
    };
  }
}
