import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, } from '@nestjs/config';
import { MailerModule } from '@nest-modules/mailer';
import { HandlebarsAdapter } from '@nest-modules/mailer';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import ormconfig from './ormconfig';
import { ConfigService as config } from './common/config.service';
import { SharedModule } from './shared/shared.module';
import { HttpExceptionFilter } from './shared/http-exception.filter';
import { UserModule } from './modules/user/user.module';
import { GallaryModule } from './modules/gallary/gallary.module';

import { VenueModule } from './modules/venue/venue.module';
import { TourModule } from './modules/tour/tour.module';
import { StopsModule } from './modules/stops/stops.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from './cron.service';
import { AppGateway } from './app.gateway';


@Module({
    imports: [
        AngularModule.forRoot({
            rootPath: join(process.cwd(), 'backend/dist/demo'),
            renderPath: '*',
        }),
        TypeOrmModule.forRoot(ormconfig),
        AuthModule,
        UserModule,
        GallaryModule,
        PoiModule,
        VenueModule,
        TourModule,
        StopsModule,
        PreviewModule,
        SharedModule.forRoot(),
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [config],
            useFactory: async (configService: config) => ({
                transport: {
                    host: config.get('MAIL_HOST'),
                    port: config.get('MAIL_PORT'),
                    secure: false,
                    auth: {
                        user: config.get('MAIL_USERNAME'),
                        pass: config.get('MAIL_PASSWORD'),
                    },
                },
                defaults: {
                    forceEmbeddedImages: config.get('MAIL_EMBEDDED_IMAGES'),
                    from: `${config.get('APP_NAME')} <${config.get('MAIL_FROM_EMAIL')}>`,
                },
                template: {
                    dir: process.cwd() + '/views/email-templates',
                    adapter: new HandlebarsAdapter(), // or new PugAdapter()
                    options: {
                        strict: true,
                    },
                },
            }),
        }),
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        ScheduleModule.forRoot()


    ],
    controllers: [AppController],
    providers: [
        AppGateway,
        CronService,
        AppService,

        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter,
        },
        // {
        //   provide: ConfigService,
        //   useValue: ConfigService.init(`.env`),
        // },
    ],
})
export class AppModule { }
