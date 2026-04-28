import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { NewsCrawlerService } from '../src/news/news-crawler.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('TestNews');
  logger.log('Bootstrapping application context for news test...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const newsCrawler = app.get(NewsCrawlerService);

  logger.log('Starting manual news sync for testing...');
  
  try {
    // Para o teste ser rápido, vamos simular uma busca direta por um time/liga
    // Em vez de syncAllNews() que percorreria tudo.
    
    const testQueries = ['Flamengo', 'Brasileirão Série A', 'Neymar'];
    
    for (const query of testQueries) {
      logger.log(`Crawling news for: ${query}`);
      // @ts-ignore - Acessando método privado para teste direcionado
      await newsCrawler.crawlNewsForQuery(query, {});
    }

    logger.log('Test crawl finished. Check the database for new entries.');
  } catch (err) {
    logger.error(`Test failed: ${err.message}`);
  } finally {
    await app.close();
  }
}

bootstrap();
