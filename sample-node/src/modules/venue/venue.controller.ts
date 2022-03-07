import { Controller, UnprocessableEntityException, BadRequestException, UseGuards, Get,Delete,Param, Request, Body, Res, HttpStatus, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOkResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { UserService, VenueService } from 'src/shared/services';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthService } from '../auth/auth.service';
import { ChangePasswordDTO } from 'src/shared/dto/changePassword.dto';

@Controller('api/venue')
export class VenueController {
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private venueService: VenueService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('/markers')
  async get(
    @Request() request: any,
    @Body() body: any,
    @Res() res: Response
  ): Promise<any> {
    return await this.venueService
      .getMarkers()
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
  @Get('/')
  async getVenueList(
    @Request() request: any,
    @Res() res: Response
  ): Promise<any> {
    return await this.venueService
      .getVenues(request)
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
  @Delete('/:id')
  async delete(
    @Param('id') id,
    @Res() res: Response
  ): Promise<any> {
    return await this.venueService
      .deleteVenue(id)
      .then(async reasons => {
        return res.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          data: 'Venue deleted successfully',
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
    @Res() res: Response
  ): Promise<any> {
    return await this.venueService
      .restoreVenue(body)
      .then(async reasons => {
        return res.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          data: 'Venue activated successfully',
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
    @Res() res: Response
  ): Promise<any> {
    let user = request.user;
    return await this.venueService
      .getVenue(id,user)
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
    return await this.venueService
      .createVenue(body,user)
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
  @Delete('marker-media/:id')
  async deleteMarkerMedia(
    @Param('id') id,
    @Res() res: Response
  ): Promise<any> {
    return await this.venueService
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

  @UseGuards(AuthGuard('jwt'))
  @Delete('marker/:id')
  async deleteMarker(
    @Param('id') id,
    @Res() res: Response
  ): Promise<any> {
    return await this.venueService
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
  @Post('edit-marker')
  @ApiOkResponse({ description: 'Successfully authenticated' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async editMarker(
    @Request() request: any,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<any> {
    let user = request.user;
    return await this.venueService
      .editMarker(body,user)
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
  @Post('edit-marker-location')
  @ApiOkResponse({ description: 'Successfully authenticated' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async editMarkerLocation(
    @Request() request: any,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<any> {
    let user = request.user;
    return await this.venueService
      .updateMarkerLocation(body)
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
  @Post('updateInfoXml')
  @ApiOkResponse({ description: 'Successfully authenticated' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async updateVenueXmlInfoMarkers(
    @Request() request: any,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<any> {
    let user = request.user;
    return await this.venueService
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

}