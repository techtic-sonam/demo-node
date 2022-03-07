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
import { UserService, PoiService, StopsService } from 'src/shared/services';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthService } from '../auth/auth.service';
import { ChangePasswordDTO } from 'src/shared/dto/changePassword.dto';
import { imageFileFilter } from 'src/shared/helpers/utill';
import { Express } from 'express';

@Controller('api/stop')
export class StopsController {
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private poiService: PoiService,
    private stopsService: StopsService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('/')
  @ApiOkResponse({ description: 'Successfully authenticated' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async getStopList(
    @Request() request: any,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<any> {
    return await this.stopsService
      .getStopList(request)
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
  @Delete(':id')
  async delete(@Param('id') id, @Res() res: Response): Promise<any> {
    return await this.stopsService
      .deleteStop(id)
      .then(async reasons => {
        return res.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          data: 'Stop deleted successfully',
        });
      })
      .catch((error: any) => {
        throw new UnprocessableEntityException(error);
      });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/restore')
  async restore(
    @Request() request: any,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<any> {
    return await this.stopsService
      .restore(body)
      .then(async reasons => {
        return res.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          data: 'Stop activated successfully',
        });
      })
      .catch((error: any) => {
        throw new UnprocessableEntityException(error);
      });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/:id')
  async findOne(
    @Param('id') id,
    @Request() request: any,
    @Res() res: Response,
  ): Promise<any> {
    let user = request.user;
    return await this.stopsService
      .getStopDetail(id, user)
      .then(async data => {
        return res.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          data: data,
        });
      })
      .catch((error: any) => {
        throw new UnprocessableEntityException(error);
      });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('create')
  @ApiOkResponse({ description: 'Successfully authenticated' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async createStop(
    @Request() request: any,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<any> {
    let user = request.user;
    return await this.stopsService
      .createStop(body, user)
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
  @Post('update-location')
  @ApiOkResponse({ description: 'Successfully authenticated' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async updateLocation(
    @Request() request: any,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<any> {
    let user = request.user;
    return await this.stopsService
      .updateLocation(body, user)
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
  @Post('edit-marker')
  @ApiOkResponse({ description: 'Successfully authenticated' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async editMarker(
    @Request() request: any,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<any> {
    let user = request.user;
    return await this.stopsService
      .editMarker(body, user)
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
  @Delete('marker/:id')
  async deleteMarker(@Param('id') id, @Res() res: Response): Promise<any> {
    return await this.stopsService
      .deleteMarker(id)
      .then(async reasons => {
        return res.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          data: 'Marker media deleted successfully',
        });
      })
      .catch((error: any) => {
        throw new UnprocessableEntityException(error);
      });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('updateInfoXml')
  @ApiOkResponse({ description: 'Successfully authenticated' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async updateVenueXmlInfoMarkers(
    @Request() request: any,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<any> {
    let user = request.user;
    return await this.stopsService
      .updateVenueXmlInfoMarkers(body)
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
  @Post('upload-tile')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: 'public/cube_temp',
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
    @Res() res: Response,
  ): Promise<any> {
    let user = request.user;
    console.log('inside');
    return await this.stopsService
      .uploadTile(request, user, file)
      .then(async reasons => {
        return res.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          data: reasons,
        });
      })
      .catch((error: any) => {
        throw new UnprocessableEntityException(error);
      });
    console.log('file===', file);
  }



  @UseGuards(AuthGuard('jwt'))
  @Delete('marker-media/:id')
  async deleteMarkerMedia(
    @Param('id') id,
    @Res() res: Response
  ): Promise<any> {
    return await this.stopsService
      .deleteMarkerMedia(id)
      .then(async reasons => {
        return res.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          data: 'Marker media deleted successfully',
        });
      })
      .catch((error: any) => {
        throw new UnprocessableEntityException(error);
      });
  }

}
