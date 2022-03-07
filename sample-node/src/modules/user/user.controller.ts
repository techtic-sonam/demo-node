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
import { UserService } from 'src/shared/services';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthService } from '../auth/auth.service';
import { ChangePasswordDTO } from 'src/shared/dto/changePassword.dto';

@Controller('api/user')
export class UserController {
  constructor(
    private userService: UserService,
    private authService: AuthService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('settings')
  @ApiOkResponse({ description: 'Successfully authenticated' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async getSettings(@Res() res: Response): Promise<any> {
    return await this.userService
      .getSettings()
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
  @Get('all')
  @ApiOkResponse({ description: 'Successfully authenticated' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async getAllUser(
    @Body() body: any,
    @Request() request: any,
    @Res() res: Response,
  ): Promise<any> {
    let user = request.user;
    console.log('in info Data');
    console.log('inside controller method');
    return await this.userService
      .getAllUser(user, request.query)
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

  @Get('reverse-logo')
  @ApiOkResponse({ description: 'Successfully authenticated' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async getReverseLogo(@Res() res: Response): Promise<any> {
    return await this.userService
      .getReverseLogo()
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
  @Get('tour-categories')
  @ApiOkResponse({ description: 'Successfully authenticated' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async getTourCategories(@Res() res: Response): Promise<any> {
    return await this.userService
      .getTourCategories()
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
  @Get('eula-agreements')
  @ApiOkResponse({ description: 'Successfully authenticated' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async getEulaAgreements(@Res() res: Response): Promise<any> {
    return await this.userService
      .getEulaAgreements()
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
  @Post('settings')
  @ApiOkResponse({ description: 'Successfully authenticated' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async updateSettings(
    @Body() body: any,
    @Res() res: Response,
    @Body() payload: any,
  ): Promise<any> {
    return await this.userService
      .updateSettings(body)
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
  @Post('update-profile')
  @ApiOkResponse({ description: 'Successfully authenticated' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async updateProfile(
    @Body() body: any,
    @Res() res: Response,
    @Body() payload: any,
  ): Promise<any> {
    return await this.userService
      .updateProfile(body)
      .then(async reasons => {
        if (reasons.isChangeEmail) {
          const tokenData = this.authService.createToken(reasons);
          reasons.tokenData = tokenData.token;
        }
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
  @Post('create-user')
  @ApiOkResponse({ description: 'Successfully authenticated' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async updateUser(
    @Request() request: any,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<any> {
    let type = body.type ? body.type : null;
    return await this.userService
      .create(body, type)
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
  @Post('change-password')
  @ApiOkResponse({ description: 'Successfully authenticated' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async changeUserPassword(
    @Request() request: any,
    @Body() payload: ChangePasswordDTO,
    @Res() response: Response,
  ): Promise<any> {
    try {
      return await this.userService
        .changePassword(payload)
        .then(() => {
          return response.status(HttpStatus.OK).json({
            status: HttpStatus.OK,
            message: 'Password changed successfully.',
          });
        })
        .catch((error: any) => {
          throw new BadRequestException(error);
        });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('profile-pic')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: 'public/profile',
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
  async uploadFile(
    @UploadedFile() file,
    @Request() request: any,
    @Res() res: Response,
  ) {
    let filePath = file.destination + '/' + file.filename;
    return await this.userService
      .create({
        id: request.user.id,
        profile_pic_multer: filePath,
      })
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
  @Get('')
  @ApiOkResponse({ description: 'Successfully authenticated' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async getUsers(
    @Request() request: any,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<any> {
    return await this.userService
      .get(request.query)
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
  @Post('/delete')
  async delete(
    @Request() request: any,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<any> {
    return await this.userService
      .delete(body)
      .then(async reasons => {
        return res.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          data: 'User deleted successfully',
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
    return await this.userService
      .restore(body)
      .then(async reasons => {
        return res.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          data: 'User activated successfully',
        });
      })
      .catch((error: any) => {
        throw new UnprocessableEntityException(error);
      });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(
    @Param('id') id,
    @Request() request,
    @Res() res: Response,
  ): Promise<any> {
    let user = request.user;
    return await this.userService
      .getUser(id, user)
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
  @Post('/deletePropertyType')
  async deletePropertyType(
    @Request() request: any,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<any> {
    return await this.userService
      .deletePropertyType(body)
      .then(async reasons => {
        return res.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          data: 'Property deleted successfully',
        });
      })
      .catch((error: any) => {
        throw new UnprocessableEntityException(error);
      });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/user-agreement')
  async agreeUserAgreement(
    @Request() request: any,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<any> {
    let user = request.user;
    return await this.userService
      .agreeEulaAgreement(user, body)
      .then(async reasons => {
        return res.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          data: 'User agreement is done successfully',
        });
      })
      .catch((error: any) => {
        throw new UnprocessableEntityException(error);
      });
  }
}
