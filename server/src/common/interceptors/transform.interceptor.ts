import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface TransformedResponse<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, TransformedResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<TransformedResponse<T>> {
    return next.handle().pipe(
      map((response) => {
        // Don't double-wrap paginated responses that already have { data, meta }
        if (
          response &&
          typeof response === 'object' &&
          'data' in response &&
          'meta' in response
        ) {
          return response;
        }
        return { data: response };
      }),
    );
  }
}
