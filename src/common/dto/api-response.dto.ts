import { ApiProperty } from "@nestjs/swagger";

export class ApiResponse<T> {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: T | null;

  @ApiProperty()
  statusCode: number;

  constructor(
    success: boolean,
    message: string,
    data: T | null,
    statusCode: number = 200,
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.statusCode = statusCode;
  }

  static success<T>(
    data: T | null,
    message: string = "Success",
    statusCode: number = 200,
  ): ApiResponse<T> {
    return new ApiResponse(true, message, data, statusCode);
  }

  static error<T>(
    message: string,
    statusCode: number = 400,
    data: T | null = null,
  ): ApiResponse<T> {
    return new ApiResponse(false, message, data, statusCode);
  }
}
