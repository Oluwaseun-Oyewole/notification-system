import { HttpStatus } from '@nestjs/common';
import { ApiResponse } from '../interfaces/api.response';

export class ResponseBuilder {
  static success<T>(
    data: T,
    message = 'Request successful',
    statusCode = HttpStatus.OK,
    path?: string,
  ): ApiResponse<T> {
    return {
      success: true,
      statusCode,
      message,
      timestamp: new Date().toISOString(),
      path,
      data,
    };
  }

  static created<T>(
    data: T,
    message = 'Resource created successfully',
  ): ApiResponse<T> {
    return this.success(data, message, HttpStatus.CREATED);
  }

  static noContent(
    message = 'Resource deleted successfully',
  ): ApiResponse<null> {
    return this.success(null, message, HttpStatus.OK);
  }
}
