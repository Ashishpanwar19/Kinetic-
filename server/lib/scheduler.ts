import { Server as SocketServer } from 'socket.io';
import { runIngestionPipeline, logIngestionRun } from './rssIngestionEngine.js';

type ScheduledTask = () => Promise<void>;

interface TaskConfig {
  name: string;
  intervalMs: number;
  task: ScheduledTask;
  runOnStart?: boolean;
}

const tasks: TaskConfig[] = [];
const intervals: NodeJS.Timeout[] = [];
let started = false;

export function registerTask(config: TaskConfig): void {
  tasks.push(config);
}

export function startScheduler(): void {
  if (started) {
    console.warn('[scheduler] Already started');
    return;
  }
  started = true;

  for (const task of tasks) {
    console.log(`[scheduler] Registered: ${task.name} (every ${task.intervalMs / 1000}s)`);

    if (task.runOnStart) {
      task.task().catch(err => console.error(`[scheduler] ${task.name} initial run failed:`, err));
    }

    const interval = setInterval(() => {
      task.task().catch(err => console.error(`[scheduler] ${task.name} failed:`, err));
    }, task.intervalMs);
    intervals.push(interval);
  }
}

export function stopScheduler(): void {
  for (const interval of intervals) {
    clearInterval(interval);
  }
  intervals.length = 0;
  started = false;
  console.log('[scheduler] Stopped all tasks');
}

export function registerStreamBroadcaster(io: SocketServer): void {
  registerTask({
    name: 'stream-status-broadcast',
    intervalMs: 10 * 1000,
    runOnStart: true,
    task: async () => {
      const streams = [
        { id: 'ndtv', title: 'NDTV 24x7 Live', is_live: true, viewer_count: String(280000 + Math.floor(Math.random() * 8000)), video_id: '21X5lGlDOfg', publisher: 'NDTV' },
        { id: 'dw', title: 'DW News Live', is_live: true, viewer_count: String(140000 + Math.floor(Math.random() * 5000)), video_id: 'o6enhaQyGkI', publisher: 'DW News' },
        { id: 'nasa', title: 'NASA TV Live', is_live: true, viewer_count: String(95000 + Math.floor(Math.random() * 3000)), video_id: '21X5lGlDOfg', publisher: 'NASA' },
        { id: 'sky', title: 'Sky News Live', is_live: true, viewer_count: String(205000 + Math.floor(Math.random() * 6000)), video_id: 'YDvsBbKfLPA', publisher: 'Sky News' },
      ];

      io.emit('stream_status', {
        type: 'REALTIME_UPDATE',
        streams,
        timestamp: new Date().toISOString(),
      });
    },
  });
}

export function registerRssIngestion(io: SocketServer): void {
  const INGESTION_INTERVAL_MS = 30 * 60 * 1000;

  registerTask({
    name: 'rss-ingestion-pipeline',
    intervalMs: INGESTION_INTERVAL_MS,
    runOnStart: false,
    task: async () => {
      const startTime = Date.now();
      console.log('[scheduler] Starting scheduled RSS ingestion...');

      try {
        const result = await runIngestionPipeline();
        const duration = Date.now() - startTime;

        await logIngestionRun('scheduled', result, duration);

        if (result.articlesNew > 0) {
          io.emit('news_update', {
            action: 'RSS_INGESTION_COMPLETE',
            articlesNew: result.articlesNew,
            aiEnriched: result.aiEnriched,
            timestamp: new Date().toISOString(),
          });
        }

        console.log(`[scheduler] RSS ingestion complete: ${result.articlesNew} new articles in ${duration}ms`);
      } catch (err: any) {
        const duration = Date.now() - startTime;
        await logIngestionRun('scheduled', {
          feedsPolled: 0, articlesFetched: 0, articlesNew: 0,
          articlesDuplicate: 0, aiEnriched: 0, aiFailed: 0, newArticleIds: [],
        }, duration, err.message);
        console.error('[scheduler] RSS ingestion failed:', err.message);
      }
    },
  });
}
