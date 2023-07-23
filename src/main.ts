import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://192.168.1.200:5173',
    credentials: true,
  });
  app.use(cookieParser());
  return app.listen(9009);
}

bootstrap();
