// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { ExpressAdapter } from '@nestjs/platform-express';
// import * as express from 'express';
// import * as serverless from 'serverless-http';
// import { ValidationPipe, Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { HttpExceptionFilter } from './common/http-exception.filter';

// const server = express();
// const logger = new Logger('Main');

// async function bootstrap() {
//   const app = await NestFactory.create(
//     AppModule,
//     new ExpressAdapter(server),
//     {
//       logger: ['error', 'warn', 'log', 'verbose', 'debug'],
//       bufferLogs: true,
//     }
//   );

//   // Get config service
//   const configService = app.get(ConfigService);

//   // Global pipes
//   app.useGlobalPipes(
//     new ValidationPipe({
//       whitelist: true,
//       forbidNonWhitelisted: true,
//       transform: true,
//       transformOptions: {
//         enableImplicitConversion: true,
//       },
//     })
//   );

//   // Global filters
//   app.useGlobalFilters(new HttpExceptionFilter());

//   // Enable CORS
//   app.enableCors({
//     origin: configService.get('CORS_ORIGIN', '*'),
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//     credentials: true,
//   });

//   // Set global prefix if needed
//   if (configService.get('API_PREFIX')) {
//     app.setGlobalPrefix(configService.get('API_PREFIX'));
//   }

//   await app.init();

//   logger.log('Application initialized');
//   return server;
// }

// let cachedServer: express.Express;

// export const handler = async (event: any, context: any) => {
//   if (!cachedServer) {
//     try {
//       cachedServer = await bootstrap();
//       logger.log('Server bootstrapped for Lambda');
//     } catch (error) {
//       logger.error('Failed to bootstrap server', error.stack);
//       throw error;
//     }
//   }

//   try {
//     const result = await serverless(cachedServer, {
//       binary: ['image/*', 'application/pdf'],
//       request: (request, event, context) => {
//         request.lambdaEvent = event;
//         request.lambdaContext = context;
//       },
//     })(event, context);

//     logger.debug('Lambda invocation completed');
//     return result;
//   } catch (error) {
//     logger.error('Lambda handler error', error.stack);
//     throw error;
//   }
// };

// // Local development
// if (process.env.NODE_ENV === 'development') {
//   bootstrap().then((app) => {
//     const port = process.env.PORT || 3000;
//     app.listen(port, () => {
//       logger.log(`Server is running on http://localhost:${port}`);
//     });
//   }).catch((err) => {
//     logger.error('Error during bootstrap', err);
//     process.exit(1);
//   });
// }



import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import * as serverless from 'serverless-http';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/http-exception.filter';
// import { HttpExceptionFilter } from './common/filters/http-exception.filter';

const server = express();
const logger = new Logger('Main');

async function bootstrap() {
  try {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(server),
      {
        logger: ['error', 'warn', 'log', 'verbose', 'debug'],
        bufferLogs: true,
      }
    );

    // Get config service
    const configService = app.get(ConfigService);

    // Verify required environment variables
    const requiredEnvVars = ['DYNAMODB_TABLE', 'AWS_REGION'];
    requiredEnvVars.forEach((varName) => {
      if (!configService.get(varName)) {
        throw new Error(`Missing required environment variable: ${varName}`);
      }
    });

    // Global pipes
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      })
    );

    // Global filters
    app.useGlobalFilters(new HttpExceptionFilter());

    // Enable CORS
    app.enableCors({
      origin: configService.get('CORS_ORIGIN', '*'),
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });

    // Set global prefix if needed
    const apiPrefix = configService.get('API_PREFIX');
    if (apiPrefix) {
      app.setGlobalPrefix(apiPrefix);
    }

    await app.init();
    logger.log('Application initialized');
    return server;
  } catch (error) {
    logger.error('Failed to initialize application', error.stack);
    throw error;
  }
}

let cachedServer: express.Express;

export const handler = async (event: any, context: any) => {
  // Handle API Gateway stage prefix
  if (event.path && event.path.startsWith(`/${process.env.STAGE}/`)) {
    event.path = event.path.substring(process.env.STAGE.length + 1);
  }

  if (!cachedServer) {
    try {
      cachedServer = await bootstrap();
      logger.log('Server bootstrapped for Lambda');
    } catch (error) {
      logger.error('Bootstrap failed', error.stack);
      throw error;
    }
  }

  try {
    const result = await serverless(cachedServer, {
      binary: ['image/*', 'application/pdf', 'application/octet-stream'],
      request: (request, event, context) => {
        request.lambdaEvent = event;
        request.lambdaContext = context;
      },
    })(event, context);

    logger.debug('Lambda invocation completed');
    return result;
  } catch (error) {
    logger.error('Handler execution failed', error.stack);
    throw {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

// Local development
if (process.env.NODE_ENV === 'development') {
  bootstrap()
    .then((app) => {
      const port = process.env.PORT || 3000;
      app.listen(port, () => {
        logger.log(`Server running on http://localhost:${port}`);
      });
    })
    .catch((err) => {
      logger.error('Local startup failed', err);
      process.exit(1);
    });
}