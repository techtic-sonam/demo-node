import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength, Validate } from 'class-validator';


export class RegisterDTO {
  id: string;
  @ApiProperty({
    required: false,
  })
  @IsEmail()
  @IsNotEmpty({
    message: 'The email should not be empty',
  })
  email: string;

  @ApiProperty({
    required: true,
  })
  @IsNotEmpty({
    message: 'The company name should not be empty',
  })
  company_name: string;

  @ApiProperty({
    required: true,
  })
  @IsNotEmpty({
    message: 'The contact person info should not be empty',
  })
  contact_person_info: string;


  @ApiProperty({
    required: false,
  })
  name: string;

  @ApiProperty({
    required: true,
  })
  @IsNotEmpty({
    message: 'The password should not be empty',
  })
  @MinLength(8)
  password: string;

  @ApiProperty({
    required: false,
  })
  mobile_number: string;

  @ApiProperty({
    required: false,
  })
  contact_address: string;

  @ApiProperty({
    required: false,
  })
  contact_city: string;

  @ApiProperty({
    required: false,
  })
  contact_state: string;

  @ApiProperty({
    required: false,
  })
  contact_country: string;

  @ApiProperty({
    required: false,
  })
  contact_zip: string;

  @ApiProperty({
    required: true,
  })
  @ApiProperty({
    required: false,
  })
  billing_address: string;

  @ApiProperty({
    required: true,
  })
  @IsNotEmpty({
    message: 'The billing city should not be empty',
  })
  billing_city: string;

  @ApiProperty({
    required: true,
  })
  @IsNotEmpty({
    message: 'The billing state should not be empty',
  })
  billing_state: string;

  @ApiProperty({
    required: true,
  })
  @IsNotEmpty({
    message: 'The billing country should not be empty',
  })
  billing_country: string;

  @ApiProperty({
    required: true,
  })
  @IsNotEmpty({
    message: 'The billing zip should not be empty',
  })
  billing_zip: string;

  @ApiProperty({
    required: true,
  })
  @IsNotEmpty({
    message: 'The taxt identification number should not be empty',
  })
  tax_identification_number: string;

  @ApiProperty({
    required: true,
  })
  @IsNotEmpty({
    message: 'The compnay registration number should not be empty',
  })
  company_registration_number: string;
  user_type: string;
}
