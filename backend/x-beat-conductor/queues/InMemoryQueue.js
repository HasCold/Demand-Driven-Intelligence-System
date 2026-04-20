class InMemoryQueue {
  constructor({ concurrency }) {
    this.concurrency = Math.max(1, Number(concurrency) || 1);
    this.queue = [];
    this.active = 0;
    this.drainResolvers = [];
    this.stopped = false;
  }

  push(job) {
    if (this.stopped) return;
    this.queue.push(job);
    this._pump();
  }

  stop() {
    this.stopped = true;
  }

  size() {
    return this.queue.length;
  }

  onDrain() {
    if (this.queue.length === 0 && this.active === 0) return Promise.resolve();
    return new Promise((resolve) => this.drainResolvers.push(resolve));
  }

  async _run(job) {
    try {
      await job();
    } finally {
      this.active--;
      this._pump();
      if (this.queue.length === 0 && this.active === 0) {
        const resolvers = this.drainResolvers.splice(0, this.drainResolvers.length);
        resolvers.forEach((r) => r());
      }
    }
  }

  _pump() {
    if (this.stopped) return;
    while (this.active < this.concurrency && this.queue.length > 0) {
      const job = this.queue.shift();
      this.active++;
      void this._run(job);
    }
  }
}

module.exports = { InMemoryQueue };

