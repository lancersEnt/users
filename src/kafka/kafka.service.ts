import { Injectable } from '@nestjs/common';
import { log } from 'console';
import { Kafka, logLevel } from 'kafkajs';

@Injectable()
export class KafkaService {
  private kafka;
  private producer;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'MyKlad',
      brokers: ['localhost:9092'],
      logLevel: logLevel.ERROR,
    });

    this.producer = this.kafka.producer();
  }

  async produce(topic: string, message: string): Promise<void> {
    await this.producer.connect();
    await this.producer.send({
      topic,
      messages: [{ value: message }],
    });
    await this.producer.disconnect();
  }

  async consume(topics: string[]): Promise<void> {
    const consumer = this.kafka.consumer({ groupId: 'MyKlad' });

    await consumer.connect();
    await Promise.all(topics.map((topic) => consumer.subscribe({ topic })));

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log({
          topic,
          value: message.value.toString(),
        });
      },
    });
  }
}
