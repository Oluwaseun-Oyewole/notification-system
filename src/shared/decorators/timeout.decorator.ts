import { SetMetadata } from '@nestjs/common';

export const REQUEST_TIMEOUT = 'request_timeout';

export const Timeout = (ms: number) => SetMetadata(REQUEST_TIMEOUT, ms);
