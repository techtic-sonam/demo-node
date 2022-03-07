import {
  Controller,
  UnprocessableEntityException,
  BadRequestException,
  UseGuards,
  Get,
  Delete,
  Param,
  Request,
  Body,
  Res,
  HttpStatus,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOkResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { UserService, GallaryService } from 'src/shared/services';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthService } from '../auth/auth.service';
import { ChangePasswordDTO } from 'src/shared/dto/changePassword.dto';

@Controller('api/gallary')
export class GallaryController {
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private gallaryService: GallaryService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('/list')
  async get(
    @Request() request: any,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<any> {
    let user = request.user;
    return await this.gallaryService
      .get(body, user)
      .then(async reasons => {
        return res.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          data: reasons,
        });
      })
      .catch((error: any) => {
        throw new UnprocessableEntityException(error);
      });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/images')
  async addImages(
    @Request() request: any,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<any> {
    let user = request.user;
    return await this.gallaryService
      .addImages(body, user)
      .then(async reasons => {
        return res.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          data: reasons,
        });
      })
      .catch((error: any) => {
        throw new UnprocessableEntityException(error);
      });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/edit')
  async editMedia(
    @Request() request: any,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<any> {
    let user = request.user;
    return await this.gallaryService
      .editMedia(body, user)
      .then(async reasons => {
        return res.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          data: reasons,
        });
      })
      .catch((error: any) => {
        throw new UnprocessableEntityException(error);
      });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('save-tiles')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: 'public/cube/cube_gallary',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiOkResponse({ description: 'Successfully authenticated' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async uploadTile(
    @UploadedFile() file,
    @Request() request: any,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<any> {
    console.log('======console1=======');
    let user = request.user;
    return await this.gallaryService
      .uploadTile(body, user, file)
      .then(async reasons => {
        console.log('======console12=======');
        return res.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          data: reasons,
        });
      })
      .catch((error: any) => {
        throw new UnprocessableEntityException(error);
      });
  }

  @Post('/used-status')
  async mediaDetail(
    @Request() request: any,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<any> {
    let user = request.user;
    return await this.gallaryService
      .mediaDetail(body, user)
      .then(async reasons => {
        return res.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          data: reasons,
        });
      })
      .catch((error: any) => {
        throw new UnprocessableEntityException(error);
      });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/delete-media')
  async mediaDelete(
    @Request() request: any,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<any> {
    let user = request.user;
    return await this.gallaryService
      .mediaDelete(body, user)
      .then(async reasons => {
        return res.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          data: reasons,
        });
      })
      .catch((error: any) => {
        throw new UnprocessableEntityException(error);
      });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/delete-all-media')
  async deleteAllMedia(
    @Request() request: any,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<any> {
    let user = request.user;
    return await this.gallaryService
      .deleteAllMedia(body, user)
      .then(async reasons => {
        return res.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          data: reasons,
        });
      })
      .catch((error: any) => {
        throw new UnprocessableEntityException(error);
      });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/count-all-trash')
  async trashMediaCount(
    @Request() request: any,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<any> {
    let user = request.user;
    return await this.gallaryService
      .trashMediaCount(body, user)
      .then(async reasons => {
        return res.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          data: reasons,
        });
      })
      .catch((error: any) => {
        throw new UnprocessableEntityException(error);
      });
  }


  @UseGuards(AuthGuard('jwt'))
  @Get('/transfer')
  async transferFiles(
    @Request() request: any,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<any> {
    console.log('in data');
    return await this.gallaryService
      .tranferFiles()
      .then(async reasons => {
        return res.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          data: reasons,
        });
      })
      .catch((error: any) => {
        throw new UnprocessableEntityException(error);
      });
  }

}
