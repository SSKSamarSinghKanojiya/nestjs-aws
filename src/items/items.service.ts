import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ItemsService {
  constructor(private readonly databaseService: DatabaseService) {}
  //  constructor(
  //   @Inject('DATABASE_SERVICE')
  //   private readonly databaseService: DatabaseService
  // ) {}

  // Create item with proper keys
  async create(item: any) {
    // Example: pk = 'ITEM#123', sk = 'METADATA'
    const pk = `ITEM#${item.id}`;
    const sk = 'METADATA';
    return await this.databaseService.create(item, pk, sk);
  }

  // Get item by ID
  async findOne(id: string) {
    const pk = `ITEM#${id}`;
    const sk = 'METADATA';
    return await this.databaseService.get(pk, sk);
  }

  // Update item
  async update(id: string, item: any) {
    const pk = `ITEM#${id}`;
    const sk = 'METADATA';
    return await this.databaseService.update(pk, sk, item);
  }

  // Delete item
  async remove(id: string) {
    const pk = `ITEM#${id}`;
    const sk = 'METADATA';
    return await this.databaseService.delete(pk, sk);
  }

  // List all items with pagination
  async findAll(limit?: number, lastEvaluatedKey?: any) {
    // Query using GSI for listing all items
    const result = await this.databaseService.query('ITEM', {
      indexName: 'gsi1',
      limit,
      exclusiveStartKey: lastEvaluatedKey,
    });

    return {
      items: result.items,
      pagination: {
        limit,
        lastEvaluatedKey: result.lastEvaluatedKey,
        hasMore: !!result.lastEvaluatedKey,
      },
    };
  }

  // Search by type with pagination
  async findByType(type: string, limit?: number, lastEvaluatedKey?: any) {
    const pk = `ITEM#${type}`;
    const result = await this.databaseService.query(pk, {
      limit,
      exclusiveStartKey: lastEvaluatedKey,
    });

    return {
      items: result.items,
      pagination: {
        limit,
        lastEvaluatedKey: result.lastEvaluatedKey,
        hasMore: !!result.lastEvaluatedKey,
      },
    };
  }
}