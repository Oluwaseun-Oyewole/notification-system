import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponse {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  error: string | Array<string>;

  @ApiProperty({ type: Date })
  timestamp: Date | string;
}
