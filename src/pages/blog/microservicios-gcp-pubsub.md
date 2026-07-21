---
layout: ../../layouts/Layout.astro
title: "Comunicación asíncrona entre microservicios con GCP Pub/Sub"
description: "Cómo uso Google Cloud Pub/Sub para desacoplar microservicios, manejar eventos de forma asíncrona y construir sistemas resilientes que toleran fallos sin perder mensajes."
pubDate: 2026-07-10
date: 2026-07-10
tags: ["GCP", "Pub/Sub", "Microservices", "NestJS", "TypeScript"]
---

# Comunicación asíncrona entre microservicios con GCP Pub/Sub

En una arquitectura de microservicios, la comunicación entre servicios es uno de los problemas más importantes a resolver. La comunicación síncrona (HTTP) funciona bien para consultas, pero introduce acoplamiento temporal: si el servicio destino está caído o lento, el servicio origen también falla.

GCP Pub/Sub resuelve esto con un modelo de mensajería basado en publicación y suscripción que desacopla emisores y receptores tanto en tiempo como en disponibilidad.

## Cómo funciona Pub/Sub

El modelo es simple:

- Un **publisher** publica mensajes en un **topic**.
- Uno o más **subscribers** tienen **subscriptions** en ese topic y reciben los mensajes.
- Si un subscriber está caído, los mensajes se retienen hasta que pueda procesarlos (configurable hasta 7 días).
- Pub/Sub garantiza entrega **at-least-once**: el mensaje puede llegar más de una vez, por lo que los handlers deben ser idempotentes.

## Publicar un evento desde NestJS

Uso el cliente oficial `@google-cloud/pubsub` envuelto en un servicio de NestJS:

```typescript
@Injectable()
export class EventBus {
  private client = new PubSub();

  async publish<T>(topic: string, data: T): Promise<void> {
    const message = Buffer.from(JSON.stringify(data));
    await this.client.topic(topic).publishMessage({ data: message });
  }
}
```

Al emitir un evento desde un caso de uso, el dominio no sabe nada de Pub/Sub, solo habla con la interfaz `EventBus`:

```typescript
// Dentro de un caso de uso
await this.eventBus.publish('order.created', {
  orderId: order.id,
  userId: order.userId,
  total: order.total,
});
```

## Consumir eventos con un subscriber

Para escuchar mensajes, creo un servicio que se suscribe al arrancar la aplicación:

```typescript
@Injectable()
export class OrderCreatedSubscriber implements OnApplicationBootstrap {
  constructor(
    private readonly eventBus: PubSubClient,
    private readonly handleOrder: HandleNewOrderUseCase,
  ) {}

  onApplicationBootstrap() {
    const subscription = this.eventBus
      .topic('order.created')
      .subscription('notifications-service.order.created');

    subscription.on('message', async (message) => {
      try {
        const data = JSON.parse(message.data.toString());
        await this.handleOrder.execute(data);
        message.ack();
      } catch (err) {
        message.nack(); // el mensaje vuelve a la cola
      }
    });
  }
}
```

El `message.ack()` confirma que el mensaje fue procesado correctamente. El `message.nack()` lo devuelve a la suscripción para que sea re-entregado.

## Idempotencia: el detalle que más importa

Como Pub/Sub puede entregar el mismo mensaje más de una vez, los handlers deben ser **idempotentes**: procesar el mismo mensaje dos veces debe producir el mismo resultado que procesarlo una sola vez.

La estrategia que uso es guardar el `messageId` de Pub/Sub en base de datos antes de procesar:

```typescript
const alreadyProcessed = await this.processedMessages.exists(message.id);
if (alreadyProcessed) {
  message.ack();
  return;
}

await this.processedMessages.save(message.id);
// ... lógica del handler
message.ack();
```

## Dead Letter Topics

Cuando un mensaje falla repetidamente, no conviene que bloquee la suscripción para siempre. Pub/Sub permite configurar un **Dead Letter Topic (DLT)**: después de N intentos fallidos, el mensaje se mueve a ese topic para ser analizado manualmente.

Lo configuro directamente en la consola de GCP o via Terraform:

```hcl
resource "google_pubsub_subscription" "order_notifications" {
  name  = "notifications-service.order.created"
  topic = google_pubsub_topic.order_created.id

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dlq.id
    max_delivery_attempts = 5
  }
}
```

## Cuándo usar Pub/Sub vs HTTP

| Caso | Recomendación |
|---|---|
| Necesito la respuesta inmediatamente | HTTP/gRPC |
| No necesito respuesta, solo notificar | Pub/Sub |
| El receptor puede estar caído momentáneamente | Pub/Sub |
| Múltiples servicios deben reaccionar al mismo evento | Pub/Sub |
| Flujo de trabajo con pasos secuenciales | Pub/Sub + saga |

La combinación que uso más frecuentemente: HTTP para queries y comandos que requieren respuesta inmediata, Pub/Sub para eventos del dominio que otros servicios necesitan procesar de forma asíncrona.
