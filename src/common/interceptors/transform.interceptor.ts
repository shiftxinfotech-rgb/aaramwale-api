import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class TransformInterceptor<T>
    implements NestInterceptor<T, ApiResponse<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<ApiResponse<T>> {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;

        return next.handle().pipe(
            map((data) => {
                // Check if data is already wrapped (e.g., from a service that wasn't refactored yet)
                const isPreWrapped = data && typeof data === 'object' && 'success' in data && 'data' in data;
                const isPaginated = data && typeof data === 'object' && 'data' in data && 'meta' in data && !('success' in data);

                const finalData = isPaginated ? data : (isPreWrapped ? data.data : (data?.data !== undefined ? data.data : data));
                const finalMessage = isPreWrapped ? data.message : (data?.message || 'Operation successful');

                return {
                    success: true,
                    message: finalMessage,
                    data: finalData,
                    statusCode,
                    timestamp: new Date().toISOString(),
                };
            }),
        );
    }
}
