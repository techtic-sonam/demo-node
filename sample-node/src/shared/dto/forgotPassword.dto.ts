import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';

export class ForgotPasswordDTO {

    /**
    * Email parameter
    */
    @ApiProperty({
        required: true
    })
    @IsNotEmpty({
        message: "The email should not be empty"
    })
    email: string;

    type:string;
}
