import { Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TokenGuard } from '../auth/token.guard';
import { ConfigService } from './config.service';

@ApiTags('config')
@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Public endpoint — no auth required.
   * Frontend polls this to check if tracking is enabled.
   */
  @Get('tracking-status')
  @ApiOperation({ summary: 'Check if tracking is enabled (public, no auth)' })
  async getTrackingStatus() {
    return this.configService.getTrackingStatus();
  }

  /**
   * Toggle tracking on/off — requires auth.
   */
  @Patch('toggle-tracking')
  @UseGuards(TokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Toggle tracking on/off (requires auth)' })
  async toggleTracking() {
    return this.configService.toggleTracking();
  }
}
