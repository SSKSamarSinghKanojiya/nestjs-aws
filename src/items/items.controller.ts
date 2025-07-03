import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
} from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { PaginationDto } from './dto/pagination.dto';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  create(@Body() createItemDto: CreateItemDto) {
    return this.itemsService.create(createItemDto);
  }

  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const parsedLastKey = paginationDto.lastKey 
      ? JSON.parse(decodeURIComponent(paginationDto.lastKey)) 
      : undefined;
    return this.itemsService.findAll(
      paginationDto.limit,
      parsedLastKey,
    );
  }

  @Get('type/:type')
  async findByType(
    @Param('type') type: string,
    @Query() paginationDto: PaginationDto,
  ) {
    const parsedLastKey = paginationDto.lastKey 
      ? JSON.parse(decodeURIComponent(paginationDto.lastKey)) 
      : undefined;
    return this.itemsService.findByType(
      type,
      paginationDto.limit,
      parsedLastKey,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateItemDto: UpdateItemDto) {
    return this.itemsService.update(id, updateItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.itemsService.remove(id);
  }
}