# PulseNews AI — WebSocket Architecture

## 1. Overview

PulseNews AI uses Socket.io for all real-time communication. The WebSocket layer is responsible for pushing new articles, live stream status updates, and breaking news alerts to connected clients without polling.

---

## 2. Connection Lifecycle

```
Client (Browser)                          Server (Express + Socket.io)
     │                                            │
     │  1. HTTP upgrade to WebSocket              │
     │ ─────────────────────────────────────────> │
     │                                            │
     │           2. Socket.io handshake           │
     │ <─────────────────────────────────────────>│
     │                                            │
     │  3. Connection established                 │
     │ <──────────────────────────────────────────│  server: "connection" event
     │                                            │
     │  4. Server sends INITIAL_STREAMS           │
     │ <──────────────────────────────────────────│  emit("stream_status", {type: "INITIAL_STREAMS"})
     │                                            │
     │  5. Client sends heartbeat ping            │
     │ ─────────────────────────────────────────> │  on("client_ping")
     │                                            │
     │  6. Server responds with pong              │
     │ <──────────────────────────────────────────│  emit("news_update", {action: "PONG"})
     │                                            │
     │  7. Server pushes news updates             │
     │ <──────────────────────────────────────────│  emit("news_update", {article: {...}})
     │     (repeat for each new article)          │
     │                                            │
     │  8. Server pushes stream status (every 10s)│
     │ <──────────────────────────────────────────│  emit("stream_status", {type: "REALTIME_UPDATE"})
     │                                            │
     │  9. Client disconnects (page close/tab)    │
     │ ─────────────────────────────────────────> │  server: "disconnect" event
     │                                            │
```

---

## 3. Event Catalog

### 3.1 Server-to-Client Events

| Event | Payload | Frequency | Trigger |
|-------|---------|-----------|---------|
| `stream_status` | `{ type: "INITIAL_STREAMS" \| "REALTIME_UPDATE", streams: LiveStreamUpdate[] }` | Once on connect, then every 10s | New connection / periodic timer |
| `news_update` | `{ action: string, article?: KnowledgeObject, message?: string }` | On new article discovery or AI processing complete | NewsModule / AIModule event |
| `breaking_news` | `{ article: KnowledgeObject, sources: string[] }` | Rare — only when breaking threshold met | Breaking news detector |

### 3.2 Client-to-Server Events

| Event | Payload | Purpose |
|-------|---------|---------|
| `client_ping` | `{}` | Heartbeat to verify connection is alive |
| `subscribe_topic` | `{ topic: string }` | Future: subscribe to specific category feed |
| `unsubscribe_topic` | `{ topic: string }` | Future: unsubscribe from category |

---

## 4. Client-Side Architecture

### 4.1 useSocket Hook

The `useSocket` hook manages the Socket.io connection lifecycle:

```
useSocket({ onNewsUpdate, onStreamStatus })
    │
    ├──> Creates Socket.io connection on mount
    │     io.connect(SAME_ORIGIN, { transports: ["websocket"] })
    │
    ├──> Registers event listeners
    │     socket.on("news_update", onNewsUpdate)
    │     socket.on("stream_status", onStreamStatus)
    │
    ├──> Tracks connection state
    │     isConnected: boolean
    │     streamStatuses: LiveStreamUpdate[]
    │
    ├──> Auto-reconnection (Socket.io built-in)
    │     retry interval: exponential backoff
    │     max retries: Infinity
    │
    └──> Cleanup on unmount
          socket.off("*")
          socket.disconnect()
```

### 4.2 Connection Status Indicator

The navigation bar shows a real-time connection indicator:

| State | Visual | Color |
|-------|--------|-------|
| Connected | Solid dot + "LIVE" | `#34D399` (emerald) |
| Connecting | Pulsing dot | `#FFB800` (amber) |
| Disconnected | Hollow dot + "OFFLINE" | `#B40B07` (red) |

### 4.3 Event Handling in App.tsx

```
onNewsUpdate(data):
    │
    ├──> If data.article exists:
    │     │
    │     ├──> Check if article ID already in state
    │     │     ├──> Yes: UPDATE existing article (merge AI fields)
    │     │     └──> No: PREPEND new article to feed
    │     │
    │     └──> Show toast: "New: [headline]"
    │
    └──> If data.message exists:
          └──> Show toast: data.message

onStreamStatus(data):
    │
    └──> Update streamStatuses state
          └──> LiveHubView re-renders with new viewer counts
```

---

## 5. Server-Side Architecture

### 5.1 Socket.io Server Configuration

```typescript
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],  // polling as fallback
  pingInterval: 25000,                   // 25s heartbeat
  pingTimeout: 60000,                    // 60s before disconnect
});
```

### 5.2 Broadcast Patterns

| Pattern | Method | Use Case |
|---------|--------|----------|
| Broadcast to all | `io.emit(event, data)` | News updates, stream status — all users see same data |
| Room broadcast | `io.to(room).emit(event, data)` | Future: category-specific feeds |
| Single socket | `socket.emit(event, data)` | Initial data on connection |
| Acknowledge | `socket.emit(event, data, callback)` | Future: reliable delivery confirmation |

### 5.3 Background Timers

```
┌─────────────────────────────────────────────────────┐
│  Timer 1: Live Stream Viewer Count Simulation        │
│  Interval: 10 seconds                                │
│  Action: io.emit("stream_status", { ... })          │
│  Purpose: Simulate real-time viewer count changes    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Timer 2: News Polling (Future — Volume 6)          │
│  Interval: 2-5 minutes                               │
│  Action: Fetch RSS -> Process -> io.emit("news_...") │
│  Purpose: Real news ingestion from live sources      │
└─────────────────────────────────────────────────────┘
```

---

## 6. Scaling WebSocket (Future)

### 6.1 Problem: Single-Process Limit

A single Socket.io process handles ~10,000 concurrent connections. Beyond that, multiple processes are needed, but they don't share connection state.

### 6.2 Solution: Redis Adapter

```
Client 1 ──> Nginx ──> Process A (Socket.io) ──┐
                                                ├──> Redis Pub/Sub ──┐
Client 2 ──> Nginx ──> Process B (Socket.io) ──┘                     │
                                                                     │
Client 3 ──> Nginx ──> Process C (Socket.io) ────────────────────────┘
```

When Process A emits an event, the Redis adapter publishes it to Redis. Processes B and C receive it from Redis and emit to their connected clients. All clients receive the event regardless of which process they're connected to.

### 6.3 Nginx Sticky Sessions

```
Nginx config:
  upstream socket_backend {
    ip_hash;  # Sticky sessions by IP
    server backend-1:3001;
    server backend-2:3001;
    server backend-3:3001;
  }
```

### 6.4 Scaling Roadmap

| Users | Strategy | Socket.io Processes |
|-------|----------|-------------------|
| 0-10K | Single process | 1 |
| 10K-50K | Multi-process + Redis adapter | 3-5 |
| 50K+ | Dedicated WebSocket gateway service | 5-10 (auto-scaled) |

---

## 7. Error Handling & Resilience

### 7.1 Client-Side

| Scenario | Handling |
|----------|---------|
| Initial connection fails | Retry with backoff (1s, 2s, 4s, 8s, 16s) |
| Connection drops mid-session | Socket.io auto-reconnects; UI shows "Reconnecting..." |
| Reconnect after drop | Server sends INITIAL_STREAMS again; client state is preserved |
| Event payload malformed | Log error, ignore event, don't crash UI |

### 7.2 Server-Side

| Scenario | Handling |
|----------|---------|
| Client disconnects | Log socket.id, clean up any room subscriptions |
| Event handler throws | Catch in try/catch, log error, don't crash server |
| Backpressure (slow client) | Socket.io handles buffering; disconnect if buffer exceeds 1MB |
| Memory leak from connections | Monitor active connections count; alert at > 80% of max |
