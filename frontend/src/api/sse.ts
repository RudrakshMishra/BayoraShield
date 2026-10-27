/**
 * Central SSE connection registry to guarantee all connections are cleanly closed on logout.
 */

class SseRegistry {
  private sources = new Set<EventSource>();

  public register(es: EventSource): () => void {
    this.sources.add(es);
    return () => {
      this.unregister(es);
    };
  }

  public unregister(es: EventSource): void {
    if (this.sources.has(es)) {
      es.close();
      this.sources.delete(es);
    }
  }

  public closeAll(): void {
    for (const es of this.sources) {
      try {
        es.close();
      } catch {
        // Ignored on teardown
      }
    }
    this.sources.clear();
  }

  public get count(): number {
    return this.sources.size;
  }
}

export const sseRegistry = new SseRegistry();
