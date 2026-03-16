import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class TokenGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
