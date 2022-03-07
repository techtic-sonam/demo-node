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
import { UserService, PoiService, TourService } from 'src/shared/services';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthService } from '../auth/auth.service';
import { ChangePasswordDTO } from 'src/shared/dto/changePassword.dto';
import { imageFileFilter } from 'src/shared/helpers/utill';

@Controller('api/tour')
export class TourController {
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private poiService: PoiService,
    private tourService: TourService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('/')
  @ApiOkResponse({ description: 'Successfully authenticated' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async getTourList(
    @Request() request: any,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<any> {
    return await this.tourService
      .getTourList(request)
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
    return await this.tourService
      .deleteTour(id)
      .then(async reasons => {
        return res.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          data: 'Tour deleted successfully',
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
    return await this.tourService
      .restore(body)
      .then(async reasons => {
        return res.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          data: 'Tour activated successfully',
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
    //console.log('contorller', user);
    return await this.tourService
      .getTourDetail(id, user)
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
  async createPoi(
    @Request() request: any,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<any> {
    let user = request.user;
    return await this.tourService
      .createTour(body, user)
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
