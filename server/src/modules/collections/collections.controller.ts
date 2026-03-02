import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiParam } from '@nestjs/swagger';
import { CollectionsService } from './collections.service';
import { StartCollectionDto } from './dto/start-collection.dto';
import { SubmitCollectionDto } from './dto/submit-collection.dto';
import { SaveProgressDto } from './dto/save-progress.dto';
import { DeviceAuthGuard } from '../../common/guards/device-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('collections')
@Controller('v1/collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: 'List published collections' })
  @ApiHeader({ name: 'x-device-id', required: true })
  async list(@CurrentUser() user: { id: string }) {
    return this.collectionsService.getPublishedList(user.id);
  }

  @Get(':id')
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: 'Get collection details with questions' })
  @ApiHeader({ name: 'x-device-id', required: true })
  @ApiParam({ name: 'id', description: 'Collection ID' })
  async getById(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.collectionsService.getById(user.id, id);
  }

  @Post('start')
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: 'Start a collection — generates a set of questions' })
  @ApiHeader({ name: 'x-device-id', required: true })
  async start(
    @CurrentUser() user: { id: string },
    @Body() dto: StartCollectionDto,
  ) {
    return this.collectionsService.start(user.id, dto);
  }

  @Post(':sessionId/progress')
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: 'Save in-progress answers for a collection session' })
  @ApiHeader({ name: 'x-device-id', required: true })
  @ApiParam({ name: 'sessionId', description: 'Session ID from start endpoint' })
  async saveProgress(
    @CurrentUser() user: { id: string },
    @Param('sessionId') sessionId: string,
    @Body() dto: SaveProgressDto,
  ) {
    return this.collectionsService.saveProgress(user.id, sessionId, dto);
  }

  @Post(':sessionId/submit')
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: 'Submit results for a collection session' })
  @ApiHeader({ name: 'x-device-id', required: true })
  @ApiParam({ name: 'sessionId', description: 'Session ID from start endpoint' })
  async submit(
    @CurrentUser() user: { id: string },
    @Param('sessionId') sessionId: string,
    @Body() dto: SubmitCollectionDto,
  ) {
    return this.collectionsService.submit(user.id, sessionId, dto);
  }
}
