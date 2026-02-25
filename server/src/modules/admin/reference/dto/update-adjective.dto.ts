import { PartialType } from '@nestjs/swagger';
import { CreateAdjectiveDto } from './create-adjective.dto';

export class UpdateAdjectiveDto extends PartialType(CreateAdjectiveDto) {}
