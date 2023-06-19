import { Injectable } from '@nestjs/common';
import { KafkaClient, Producer, ProduceRequest } from 'kafka-node';

@Injectable()
export class KafkaProducerService {
  private readonly producer: Producer;

  constructor() {
    const kafkaClient = new KafkaClient({ kafkaHost: 'localhost:9092' });
    this.producer = new Producer(kafkaClient);
  }

  async sendMessage(topic: string, message: any): Promise<void> {
    const payloads: ProduceRequest[] = [
      { topic, messages: [JSON.stringify(message)] },
    ];
    this.producer.send(payloads, (error, data) => {
      if (error) {
        console.error('Failed to send message:', error);
      } else {
        console.log('Message sent:', data);
      }
    });
  }
}
