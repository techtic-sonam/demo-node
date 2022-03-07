import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
const API_PREFIX = 'api';
import * as http from 'http';

async function bootstrap() {

   const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setViewEngine('hbs');
  app.use(bodyParser.json({ limit: '500mb' }));
  app.use(bodyParser.urlencoded({ limit: '500mb', extended: true }));
  app.enableCors();

  app.useGlobalPipes(new ValidationPipe());
  app.useStaticAssets(join(__dirname, '..', 'public'), { prefix: '/public' });
  app.useStaticAssets(join(process.cwd(), 'backend/dist/demo'), {
    prefix: '/',
  });


  const config = app.get(ConfigService);
  const port = config.get('APP_PORT');

  await app.listen(port).then(() => {
    console.log(`App listening on ${port || 3900}`);
  });
}
bootstrap();
