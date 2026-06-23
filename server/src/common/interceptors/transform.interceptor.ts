import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * Wraps every successful response in `{ data, meta? }`. If a handler already
 * returns an object shaped like `{ data, meta }` (e.g. paginated lists), it is
 * passed through unchanged so the meta block is preserved.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ResponseEnvelope<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseEnvelope<T>> {
    return next.handle().pipe(
      map((payload) => {
        if (
          payload &&
          typeof payload === 'object' &&
          'data' in payload &&
          'meta' in payload
        ) {
          return payload as ResponseEnvelope<T>;
        }
        return { data: payload as T };
      }),
    );
  }
}
