import { UserService } from "./user/user.service";
import { SettingService } from "./setting/setting.service";
import { EmailService } from "./email/email.service";
import { PoiService } from './poi/poi.service';
import { GallaryService } from './gallary/gallary.service';
import { VenueService } from './venue/venue.service';
import { TourService } from './tour/tour.service';
import { StopsService } from './stops/stops.service';
import { PreviewService } from './preview/preview.service';

export { UserService } from './user/user.service';
export { PoiService } from './poi/poi.service';
export { GallaryService } from './gallary/gallary.service';
export { SettingService } from "./setting/setting.service";
export { EmailService } from "./email/email.service";
export { VenueService } from './venue/venue.service';
export { TourService } from './tour/tour.service';
export { StopsService } from './stops/stops.service';
export { PreviewService } from './preview/preview.service';

const Services: any = [
    UserService,
    PoiService,
    GallaryService,
    SettingService,
    EmailService,
    VenueService,
    TourService,
    StopsService,
    PreviewService
];

export { Services };
