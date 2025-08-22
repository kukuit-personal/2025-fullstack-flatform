import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  MinLength,
  IsString,
} from 'class-validator';

export class RegisterWithRoleDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  // Tuỳ hệ thống: cập nhật mảng hợp lệ cho khớp bảng role
  @IsIn(['admin', 'client'])
  role: string;
}
