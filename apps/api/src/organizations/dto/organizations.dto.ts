import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Spektif Digital Agency' })
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  branding?: any;
}

export class UpdateOrganizationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  branding?: any;
}

export class InviteUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ required: false, example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    required: false,
    enum: ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT', 'CLIENT'],
    default: 'EMPLOYEE'
  })
  @IsOptional()
  @IsEnum(['ADMIN', 'EMPLOYEE', 'ACCOUNTANT', 'CLIENT'])
  role?: string;
}

export class CreateEmployeeDto {
  @ApiProperty({ example: 'john@spektif.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  surname: string;

  @ApiProperty({ example: 'Frontend Developer' })
  @IsString()
  position: string;

  @ApiProperty({ example: '+90 555 123 4567' })
  @IsString()
  phone: string;

  @ApiProperty({
    enum: ['EMPLOYEE', 'ADMIN', 'ACCOUNTANT'],
    default: 'EMPLOYEE'
  })
  @IsOptional()
  @IsEnum(['EMPLOYEE', 'ADMIN', 'ACCOUNTANT'])
  role?: string;
}

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT', 'CLIENT']
  })
  @IsEnum(['ADMIN', 'EMPLOYEE', 'ACCOUNTANT', 'CLIENT'])
  role: string;
}
