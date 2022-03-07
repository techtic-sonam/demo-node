import {
  Injectable,
  BadRequestException,
  Inject,
  forwardRef,
  NotAcceptableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, LessThanOrEqual, getRepository } from 'typeorm';
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
import { Country } from 'src/modules/entity/country.entity';
import { State } from 'src/modules/entity/state.entity';
import { TourCategory } from 'src/modules/entity/tour_category.entity';
import { TourHasCategories } from 'src/modules/entity/tour_has_category.entity';
import { Tours } from 'src/modules/entity/tours.entity';
import { VenueTourCategory } from 'src/modules/entity/venue_tour_category.entity';
import { PoiTourCategory } from 'src/modules/entity/poi_tour_category.entity';
import { EulaAgreement } from 'src/modules/entity/eula_agreement.entity';
import { UserEulaAgreement } from 'src/modules/entity/user_eula_agreement.entity';
import { throwError } from 'rxjs';

var pdf = require('html-pdf');
var fs = require('fs');

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
    @Inject(forwardRef(() => EmailService))
    private readonly emailService: EmailService,
    @InjectRepository(UserHasRole)
    private readonly userHasRoleRepository: Repository<UserHasRole>,
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
    @InjectRepository(Country)
    private readonly countryRepository: Repository<Country>,
    @InjectRepository(State)
    private readonly stateRepository: Repository<State>,
    @InjectRepository(TourCategory)
    private readonly tourCategoryRepository: Repository<TourCategory>,
    @InjectRepository(TourHasCategories)
    private readonly tourHasCategoriesRepository: Repository<TourHasCategories>,
    @InjectRepository(Tours)
    private readonly toursRepository: Repository<Tours>,
    @InjectRepository(VenueTourCategory)
    private readonly venueTourRepository: Repository<VenueTourCategory>,
    @InjectRepository(PoiTourCategory)
    private readonly poiTourCategoryRepository: Repository<PoiTourCategory>,
    @InjectRepository(EulaAgreement)
    private readonly eulaAgreementRepository: Repository<EulaAgreement>,
    @InjectRepository(UserEulaAgreement)
    private readonly userEulaAgreementRepository: Repository<UserEulaAgreement>,
  ) {}

  async create(payload, type = null): Promise<any> {
    try {
      let user = new User();

      console.log(payload);

      if (payload.company_name) {
        user.company_name = payload.company_name;
      }

      if (payload.contact_person_info) {
        user.contact_person_info = payload.contact_person_info;
      }

      if (payload.mobile_number) {
        user.mobile_number = payload.mobile_number;
      }
      if (payload.first_name) {
        user.first_name = payload.first_name;
      }

      if (payload.last_name) {
        user.last_name = payload.last_name;
      }

      if (payload.email) {
        if (payload.id) {
          let find = await this.userRepository
            .createQueryBuilder('user')
            .where('email = :email and id != :id', {
              email: payload.email,
              id: payload.id,
            })
            .getOne();
          if (find) {
            throw new Error('This email is already used.');
          }
          user.email = payload.email;
        } else {
          user.email = payload.email;
          let find = await this.userRepository.findOne({
            email: payload.email,
          });
          if (find) {
            throw new Error('This email is already used.');
          }
        }
      }

      if (payload.password) {
        user.password = payload.password;
      }

      user.contact_address = payload.contact_address;
      user.contact_city = payload.contact_city;
      user.contact_state = payload.contact_state;
      user.contact_country = payload.contact_country;
      user.contact_zip = payload.contact_zip;

      if (payload.billing_address) {
        user.billing_address = payload.billing_address;
      }

      if (payload.billing_city) {
        user.billing_city = payload.billing_city;
      }

      if (payload.billing_state) {
        user.billing_state = payload.billing_state;
      }

      if (payload.billing_country) {
        user.billing_country = payload.billing_country;
      }

      if (payload.billing_zip) {
        user.billing_zip = payload.billing_zip;
      }

      if (payload.tax_identification_number) {
        user.tax_identification_number = payload.tax_identification_number;
      }

      if (payload.company_registration_number) {
        user.company_registration_number = payload.company_registration_number;
      }

      if (payload.status) {
        user.status = payload.status;
      }

      if (payload.id) {
        console.log('during edit', user);
        await this.userRepository.update(payload.id, user);
      } else {
        user.status = 'Active';
        if (type == 'admin-registration') {
          user.is_verified = true;
          let data = await this.userRepository.save(user);
          payload.id = data.id;
          this.updateUserRole(payload);
          user = await this.getUser(payload.id);
          await this.emailService
            .adminRegistrationEmail({ to: user.email, context: data })
            .then(res => {
              return user;
            })
            .catch(error => {
              console.log('error', error);
              throw new BadRequestException(error);
            });
        } else {
          let data = await this.userRepository.save(user);
          payload.id = data.id;
          this.createVericationCode(user);
          this.updateUserRole(payload);
        }
      }
      user = await this.getUser(payload.id);
      return user;
    } catch (error) {
      throw error;
    }
  }

  async updateUserRole(payload) {
    if (payload.user_type) {
      if (!Number.isInteger(payload.user_type)) {
        let roleData = await this.roleRepository.findOne({
          name: payload.user_type,
        });
        payload.user_type = roleData.id;
      }
      let userRole = await this.userHasRoleRepository.findOne({
        user_id: payload.id,
        role_id: payload.user_type,
      });
      if (!userRole) {
        console.log('payload userid', payload);
        let userRole = new UserHasRole();
        userRole.user_id = payload.id;
        userRole.role_id = payload.user_type;
        var res = await this.userHasRoleRepository.save(userRole);
      }
    }
    return true;
  }

  getRandomUpperCase() {
    return String.fromCharCode(Math.floor(Math.random() * 26) + 65);
  }

  getRandomLowerCase() {
    return String.fromCharCode(Math.floor(Math.random() * 26) + 97);
  }

  getRandomNumber() {
    return String.fromCharCode(Math.floor(Math.random() * 10) + 48);
  }

  getRandomSymbol() {
    var symbol = '!@#$%^&*(){}[]=<>/,.|~?';
    return symbol[Math.floor(Math.random() * symbol.length)];
  }

  async generatePassword(length) {
    var upper = 1;
    var lower = 1;
    var number = 1;
    var symbol = 1;

    const randomFunc = {
      upper: this.getRandomUpperCase,
      lower: this.getRandomLowerCase,
      number: this.getRandomNumber,
      symbol: this.getRandomSymbol,
    };

    let generatedPassword = '';

    const typesCount = upper + lower + number + symbol;

    //console.log(typesCount);

    const typesArr = [{ upper }, { lower }, { number }, { symbol }].filter(
      item => Object.values(item)[0],
    );

    if (typesCount === 0) {
      return '';
    }

    for (let i = 0; i < length; i += typesCount) {
      typesArr.forEach(type => {
        const funcName = Object.keys(type)[0];
        generatedPassword += randomFunc[funcName]();
      });
    }

    const finalPassword = generatedPassword.slice(0, length);

    return finalPassword;
  }

  async findOne(where: Object, relations: Array<any> = []): Promise<User> {
    return this.userRepository.findOne({ where: where, relations: relations });
  }

  async getUser(id, user: any = '') {
    try {
      let response = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.billingCountry', 'billingCountry')
        .leftJoinAndSelect('user.billingState', 'billingState')
        .leftJoinAndSelect('user.contactCountry', 'contactCountry')
        .leftJoinAndSelect('user.contactState', 'contactState')
        .leftJoinAndSelect('user.roles', 'roles')
        .leftJoinAndSelect('user.eulaInfo', 'eulaInfo')
        .leftJoinAndSelect('eulaInfo.eulaDetails', 'eulaDetails')
        .where('user.id = :id', { id: id })
        .withDeleted()
        .getOne();

      /* if(user && user.roles[0].name != 'admin'){
        throw new Error('Not authorised');
      }*/
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getByEmailAndPass(email: string, password: string) {
    console.log('inside getByEmailAndPass');
    const passHash = crypto.createHmac('sha256', password).digest('hex');
    return await this.userRepository
      .createQueryBuilder('user')
      .where('(user.email = :email) and user.password = :password')
      .setParameter('email', email)
      .setParameter('password', passHash)
      .withDeleted()
      .getOne();
  }

  async sendForgotPasswordEmail(payload): Promise<any> {
    let email = payload.email;
    console.log(email);
    let user = await this.findOne({ email: email });
    console.log('user', user);
    let verificationCode = this.makeid(10);
    await this.userRepository.update(user.id, {
      verification_code: verificationCode,
    });

    let context: any = user;
    context.token = verificationCode;
    let response_message = '';
    this.emailService
      .userForgotPassword({ to: email, context: context })
      .then(res => {})
      .catch(error => {
        throw new BadRequestException(error);
      });
    response_message = 'reset password link has been sent to your email.';

    return response_message;
  }

  async createVericationCode(user) {
    try {
      let verificationCode = this.makeid(10);
      await this.userRepository.update(user.id, {
        verification_code: verificationCode,
      });

      this.emailService
        .sentOTP({ to: user.email, otp: verificationCode, user: user })
        .then(res => {})
        .catch(error => {
          throw new BadRequestException(error);
        });

      return verificationCode;
    } catch (error) {
      throw error;
    }
  }

  makeid(length) {
    var result = '';
    var characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  async verifyAccount(email, token) {
    let user = await this.userRepository.findOne({
      email: email,
      verification_code: token,
    });
    if (user) {
      await this.userRepository.update(user.id, {
        verification_code: token,
        is_verified: true,
      });
      return await this.userRepository.findOne(user.id);
    } else {
      throw new NotAcceptableException('verification code is not match.');
    }
  }

  async checkVerification(user) {
    console.log('in user check in');
    let userData = await this.userRepository.findOne({
      id: user.id,
      is_verified: true,
    });
    if (userData) {
      return userData;
    } else {
      this.createVericationCode(user);
      throw new NotAcceptableException(
        'Your verification otp is remaining please check your mail.',
      );
    }
  }

  async resetPassword(input: any): Promise<any> {
    const user = await this.findByHashSalt(input.token, input.email);
    if (user) {
      await this.userRepository
        .update(user.id, {
          password: input.password,
          verification_code: input.token,
        })
        .then(res => {
          return true;
        })
        .catch(error => {
          throw new BadRequestException(error);
        });
    } else {
      throw new NotAcceptableException(
        'URL for reset password has been expired.',
      );
    }
  }

  async findByHashSalt(token: any, email: any): Promise<User> {
    return await this.userRepository
      .createQueryBuilder('user')
      .where('email = :email and verification_code = :verification_code')
      .setParameter('email', email)
      .setParameter('verification_code', token)
      .getOne();
  }

  async changePassword(input: any): Promise<any> {
    let matchPassword = await this.userRepository.count({
      id: input.id,
      password: input.current_password,
    });
    if (matchPassword > 0) {
      await this.userRepository
        .update(input.id, { password: input.password })
        .then(res => {
          return true;
        })
        .catch(error => {
          throw new BadRequestException(error);
        });
    } else {
      throw new NotAcceptableException('Current Password is Wrong');
    }
  }

  async delete(input: any) {
    //console.log(input);
    let user = new User();
    user.inactive_reason = input.inactive_reason;
    user.status = 'Inactive';
    await this.userRepository.update(input.id, user);
    var res = await this.userRepository.softDelete({ id: input.id });
    return res;
  }

  async restore(input: any) {
    let user = new User();
    user.inactive_reason = input.inactive_reason;
    user.status = 'Active';
    await this.userRepository.restore({ id: input.id });
    var res = await this.userRepository.update(input.id, user);
    return res;
  }

  async updateProfile(payload): Promise<any> {
    try {
      console.log(payload);
      let user = new User();

      if (payload.company_name) {
        user.company_name = payload.company_name;
      }

      if (payload.contact_person_info) {
        user.contact_person_info = payload.contact_person_info;
      }

      if (payload.first_name) {
        user.first_name = payload.first_name;
      }

      if (payload.last_name) {
        user.last_name = payload.last_name;
      }

      if (payload.billing_city) {
        user.billing_city = payload.billing_city;
      }

      if (payload.billing_state) {
        user.billing_state = payload.billing_state;
      }

      if (payload.billing_country) {
        user.billing_country = payload.billing_country;
      }

      if (payload.billing_zip) {
        user.billing_zip = payload.billing_zip;
      }

      if (payload.contact_city) {
        user.contact_city = payload.contact_city;
      }

      if (payload.contact_state) {
        user.contact_state = payload.contact_state;
      }

      if (payload.contact_country) {
        user.contact_country = payload.contact_country;
      }

      if (payload.contact_zip) {
        user.contact_zip = payload.contact_zip;
      }

      if (payload.mobile_number) {
        user.mobile_number = payload.mobile_number;
      }

      if (payload.tax_identification_number) {
        user.tax_identification_number = payload.tax_identification_number;
      }

      if (payload.company_registration_number) {
        user.company_registration_number = payload.company_registration_number;
      }

      if (payload.profile_pic) {
        const path = saveBase64Image(payload.profile_pic, 'profile');
        console.log(path);
        if (path) {
          user.profile_pic = path;
        }
      }

      user.status = 'Active';

      await this.userRepository.update(payload.id, user);
      user = await this.findOne({ id: payload.id }, [
        'billingCountry',
        'billingState',
        'contactCountry',
        'contactState',
      ]);
      return user;
    } catch (error) {
      throw error;
    }
  }

  async get(input) {
    try {
      const query = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.roles', 'roles')
        .leftJoinAndSelect('user.eulaInfo', 'eulaInfo')
        .leftJoinAndSelect('eulaInfo.eulaDetails', 'eulaDetails')
        .where('roles.name = :name', { name: input.user_type });
      //.where('user.id = 3');

      if (input.sortBy && input.sortBy != '') {
        let orderDirection: any = input.sortDesc == 'true' ? 'DESC' : 'ASC';
        query.orderBy(`user.${input.sortBy}`, orderDirection);
      } else {
        query.orderBy('user.id', 'DESC');
      }

      if (input.search && input.search != '') {
        query.andWhere(`user.first_name LIKE :search`, {
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
        query.andWhere('user.deleted_at != ""');
      }

      let response = await new Pagination(query, User, isActive).paginate(
        limit,
        page,
      );

      console.log('resInfo', response);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getSettings() {
    let settings = await this.settingRepository.find();
    return settings;
  }

  async getReverseLogo() {
    let settings = await this.settingRepository.find({ name: 'reverse_logo' });
    return settings;
  }

  async getLogo() {
    let settings = await this.settingRepository.find({ name: 'logo' });
    return settings;
  }

  async getTourCategories() {
    let categories = await this.tourCategoryRepository.find();
    return categories;
  }

  async updateSettings(payload): Promise<any> {
    // console.log(payload ,'in settinsf');
    var settings = new Setting();
    settings.value = payload.mapbox_api_key;
    var res = await this.settingRepository.update(
      { name: 'mapbox_api_key' },
      settings,
    );

    settings.value = payload.control_bar_color;
    var res = await this.settingRepository.update(
      { name: 'control_bar_color' },
      settings,
    );

    settings.value = payload.menu_bar_color;
    var res = await this.settingRepository.update(
      { name: 'menu_bar_color' },
      settings,
    );

    settings.value = payload.powered_by_link;
    var res = await this.settingRepository.update(
      { name: 'powered_by_link' },
      settings,
    );

    settings.value = payload.map_box_style;
    var res = await this.settingRepository.update(
      { name: 'map_box_style' },
      settings,
    );

    settings.value = payload.version;
    var res = await this.settingRepository.update(
      { name: 'version' },
      settings,
    );

    //console.log(payload.logo);
    if (payload.logo) {
      const path = saveBase64Image(payload.logo, 'logo');
      if (path) {
        console.log('payload.logo', path);
        settings.value = path;
        var res = await this.settingRepository.update(
          { name: 'logo' },
          settings,
        );
      }
    }

    if (payload.reverse_logo) {
      const path = saveBase64Image(payload.reverse_logo, 'logo');
      if (path) {
        settings.value = path;
        var res = await this.settingRepository.update(
          { name: 'reverse_logo' },
          settings,
        );
      }
    }

    if (payload.powered_by_logo) {
      const path = saveBase64Image(payload.powered_by_logo, 'logo');
      if (path) {
        settings.value = path;
        var res = await this.settingRepository.update(
          { name: 'powered_by_logo' },
          settings,
        );
      }
    }

    if (payload.property_types) {
      let properties = payload.property_types;
      for (var i = 0; i < properties.length; i++) {
        await this.addProperties(properties[i]);
      }
    }

    if (payload.eula_text && payload.eula_version) {
      var eulaData = [];
      const eulaVersionMatched = await this.eulaAgreementRepository
        .createQueryBuilder('eula_agreement')
        .where('eula_agreement.eula_version = :eula_version', {
          eula_version: payload.eula_version,
        })
        .getOne();

      console.log('eulaVersionMatched', eulaVersionMatched);

      if (eulaVersionMatched == undefined) {
        eulaData['eula_text'] = payload.eula_text;
        eulaData['eula_version'] = payload.eula_version;
        await this.addEulaAgreements(eulaData);
      } else {
        console.log('asdasd error');
        throw new Error('This Eula Version is already used.');
      }
    }

    let response = this.getSettings();
    return response;
  }

  async addProperties(data) {
    let property = new TourCategory();
    property.name = data.name;
    property.logo = data.logo;
    let find = await this.tourCategoryRepository.findOne({ id: data.id });
    if (find) {
      console.log('in in');
      await this.tourCategoryRepository.update(find.id, property);
    } else {
      console.log('in else');
      await this.tourCategoryRepository.save(property);
    }
  }

  async filter(arr, callback) {
    const fail = Symbol();
    return (
      await Promise.all(
        arr.map(async item => ((await callback(item)) ? item : fail)),
      )
    ).filter(i => i !== fail);
  }

  async getCountry(): Promise<any> {
    let response = await this.countryRepository
      .createQueryBuilder('country')
      .where('country.is_active = 1')
      .orderBy('country.name', 'ASC')
      .getMany();
    return response;
  }

  async getState(countryId): Promise<any> {
    let response = await this.stateRepository
      .createQueryBuilder('state')
      .where('state.country_id = :id', { id: countryId })
      .orderBy('state.name', 'ASC')
      .getMany();
    return response;
  }

  async getAllUser(user, input): Promise<any> {
    console.log('input', input);

    const query = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .where('roles.name = :name', { name: 'user' });

    if (input.name && input.name != '') {
      query.andWhere(`user.first_name LIKE :search`, {
        search: `%${input.name}%`,
      });
    }

    let response = query.getMany();
    console.log('response', response);
    return response;
  }

  async deletePropertyType(id) {
    console.log('dataId', id);
    if (id) {
      var res = await this.tourCategoryRepository.delete(id);

      await this.updateComingSoonValue(id);
      await this.updateTourVenuePOICategories(id);
      await this.updatePropertyTypes(id);
      await this.updateCSPropertyTypes(id);
    }
  }

  async updateComingSoonValue(id) {
    console.log('in data');
    const tourCSCategoryFind = await getRepository(TourHasCategories)
      .createQueryBuilder('tour_has_categories')
      .select(['coming_soon'])
      .where('tour_has_categories.category_id = :id', { id: id['id'] })
      .getRawOne();

    if (tourCSCategoryFind != undefined || tourCSCategoryFind != null) {
      console.log('cominngValue', cominngValue);
      var cominngValue = tourCSCategoryFind.coming_soon;
      if (cominngValue != null || cominngValue != undefined) {
        const tourCSCategory = await getRepository(TourHasCategories)
          .createQueryBuilder('tour_has_categories')
          .update(TourHasCategories)
          .set({ coming_soon: null })
          .where('tour_has_categories.category_id = :id', { id: id['id'] })
          .execute();

        console.log('tourCSCategory', tourCSCategory);
      }
    }
  }

  async updateTourVenuePOICategories(id) {
    const tourCategory = await getRepository(TourHasCategories)
      .createQueryBuilder('tour_has_categories')
      .update(TourHasCategories)
      .set({ category_id: 5 })
      .where('tour_has_categories.category_id = :id', { id: id['id'] })
      .execute();
    const venueCategory = await getRepository(VenueTourCategory)
      .createQueryBuilder('venue_tour_categories')
      .update(VenueTourCategory)
      .set({ category_id: 5 })
      .where('venue_tour_categories.category_id = :id', { id: id['id'] })
      .execute();
    const poiCategory = await getRepository(PoiTourCategory)
      .createQueryBuilder('poi_tour_categories')
      .update(PoiTourCategory)
      .set({ category_id: 5 })
      .where('poi_tour_categories.category_id = :id', { id: id['id'] })
      .execute();
  }

  async updatePropertyTypes(id) {
    const catUpdate = await this.toursRepository
      .createQueryBuilder('tours')
      .select(['tours.id'])
      .update(Tours)
      .set({ property_1: 5 })
      .where('tours.property_1 = :id', { id: id['id'] })
      .execute();

    const catUpdate1 = await this.toursRepository
      .createQueryBuilder('tours')
      .select(['tours.id'])
      .update(Tours)
      .set({ property_2: 5 })
      .where('tours.property_2 = :id', { id: id['id'] })
      .execute();

    const catUpdate2 = await this.toursRepository
      .createQueryBuilder('tours')
      .select(['tours.id'])
      .update(Tours)
      .set({ property_3: 5 })
      .where('tours.property_3 = :id', { id: id['id'] })
      .execute();

    const catUpdate3 = await this.toursRepository
      .createQueryBuilder('tours')
      .select(['tours.id'])
      .update(Tours)
      .set({ property_4: 5 })
      .where('tours.property_4 = :id', { id: id['id'] })
      .execute();
  }

  async updateCSPropertyTypes(id) {
    const catUpdate = await this.toursRepository
      .createQueryBuilder('tours')
      .select(['tours.id'])
      .update(Tours)
      .set({ cs_property_1: null })
      .where('tours.cs_property_1 = :id', { id: id['id'] })
      .execute();

    const catUpdate1 = await this.toursRepository
      .createQueryBuilder('tours')
      .select(['tours.id'])
      .update(Tours)
      .set({ cs_property_2: null })
      .where('tours.cs_property_2 = :id', { id: id['id'] })
      .execute();

    const catUpdate2 = await this.toursRepository
      .createQueryBuilder('tours')
      .select(['tours.id'])
      .update(Tours)
      .set({ cs_property_3: null })
      .where('tours.cs_property_3 = :id', { id: id['id'] })
      .execute();

    const catUpdate3 = await this.toursRepository
      .createQueryBuilder('tours')
      .select(['tours.id'])
      .update(Tours)
      .set({ cs_property_4: null })
      .where('tours.cs_property_4 = :id', { id: id['id'] })
      .execute();
  }

  async addEulaAgreements(data) {
    try {
      var eula = new EulaAgreement();
      eula.eula_version = data.eula_version;
      eula.eula_text = data.eula_text;

      var configOptions = {
        border: {
          top: '20in',
          right: '10in',
          bottom: '20in',
          left: '10in',
        },
      };

      pdf.create(data.eula_text, configOptions).toStream(function(err, stream) {
        stream.pipe(
          fs.createWriteStream(
            'public/documents/V' + data.eula_version + '.' + 'pdf',
          ),
        );
        if (err) {
          return err;
        }
      });
      this.eulaAgreementRepository.save(eula);
    } catch (error) {
      return error;
    }
  }

  async getEulaAgreements() {
    let eulaInfo = await this.eulaAgreementRepository.find();
    return eulaInfo;
  }

  async agreeEulaAgreement(user, eulaInfo) {
    try {
      let eulaData = new UserEulaAgreement();
      eulaData.user_id = user.id;
      eulaData.eula_id = eulaInfo.id;
      eulaData.eula_agreed_at = new Date();

      let data = await this.userEulaAgreementRepository.save(eulaData);
      return data;
    } catch (error) {
      return error;
    }
  }
}
