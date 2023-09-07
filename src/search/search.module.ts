import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import SearchService from './search.service';

@Module({
  imports: [
    ConfigModule,
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        node: 'http://localhost:9200',
        auth: {
          username: 'elastic',
          password: 'changeme',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [ElasticsearchModule, SearchService],
  providers: [SearchService],
})
export class SearchModule {}
