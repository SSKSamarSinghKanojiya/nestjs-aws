import { Injectable } from '@nestjs/common';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

@Injectable()
export class DatabaseService {
  private readonly tableName = process.env.DYNAMODB_TABLE;
  private readonly client: DynamoDBDocumentClient;

  constructor() {
    this.client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
  }

  // Helper to generate keys
  private generateKey(pk: string, sk?: string) {
    return {
      pk,
      ...(sk && { sk }),
    };
  }

  // Create item with proper keys
  async create(item: Record<string, any>, pk: string, sk?: string) {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        ...this.generateKey(pk, sk),
        ...item,
      },
    });
    return await this.client.send(command);
  }

  // Get item by keys
  async get(pk: string, sk?: string) {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: this.generateKey(pk, sk),
    });
    const result = await this.client.send(command);
    return result.Item;
  }

  // Update item with proper keys
  async update(pk: string, sk: string, item: Record<string, any>) {
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(item).forEach((key, index) => {
      updateExpressions.push(`#field${index} = :value${index}`);
      expressionAttributeNames[`#field${index}`] = key;
      expressionAttributeValues[`:value${index}`] = item[key];
    });

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: this.generateKey(pk, sk),
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const result = await this.client.send(command);
    return result.Attributes;
  }

  // Delete item by keys
  async delete(pk: string, sk?: string) {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: this.generateKey(pk, sk),
      ReturnValues: 'ALL_OLD',
    });
    const result = await this.client.send(command);
    return result.Attributes;
  }

  // Query with pagination support
  async query(
    pk: string,
    options: {
      sk?: string;
      skCondition?: string;
      indexName?: string;
      limit?: number;
      exclusiveStartKey?: Record<string, any>;
    } = {},
  ) {
    const {
      sk,
      skCondition = 'begins_with',
      indexName,
      limit,
      exclusiveStartKey,
    } = options;

    const keyConditionExpressions = [`#pk = :pk`];
    const expressionAttributeNames = { '#pk': indexName ? 'gsi1_pk' : 'pk' };
    const expressionAttributeValues = { ':pk': pk };

    if (sk) {
      if (skCondition === 'begins_with') {
        keyConditionExpressions.push(`begins_with(${indexName ? '#sk' : 'sk'}, :sk)`);
      } else if (skCondition === '=') {
        keyConditionExpressions.push(`${indexName ? '#sk' : 'sk'} = :sk`);
      }
      expressionAttributeNames['#sk'] = indexName ? 'gsi1_sk' : 'sk';
      expressionAttributeValues[':sk'] = sk;
    }

    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: indexName,
      KeyConditionExpression: keyConditionExpressions.join(' AND '),
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: limit,
      ExclusiveStartKey: exclusiveStartKey,
    });

    const result = await this.client.send(command);
    return {
      items: result.Items,
      lastEvaluatedKey: result.LastEvaluatedKey,
    };
  }

  // Scan with pagination support
  async scan(options: {
    limit?: number;
    exclusiveStartKey?: Record<string, any>;
    filterExpression?: string;
    expressionAttributeNames?: Record<string, string>;
    expressionAttributeValues?: Record<string, any>;
  } = {}) {
    const {
      limit,
      exclusiveStartKey,
      filterExpression,
      expressionAttributeNames,
      expressionAttributeValues,
    } = options;

    const command = new ScanCommand({
      TableName: this.tableName,
      Limit: limit,
      ExclusiveStartKey: exclusiveStartKey,
      FilterExpression: filterExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    });

    const result = await this.client.send(command);
    return {
      items: result.Items,
      lastEvaluatedKey: result.LastEvaluatedKey,
    };
  }
}