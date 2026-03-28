# The OpenClaw Integration: A Story of Wrong Turns and Hard-Won Insights

I remember the moment we started this project. We had a name—OpenClaw—and based on that name alone, we made an assumption that would cost us weeks of work.

It sounded cloud-native. Enterprise-y. Something that lived in a data center somewhere, accepting webhooks from the outside world. That's what "Claw" evoked to us: something reaching out from the cloud, grabbing data, pulling it somewhere. We built our entire first iteration around that mental model.

We were so wrong.

---

## The Wrong Turn

The first implementation attempted to connect to `https://api.openclaw.io/v1/webhooks/events`. We spent days designing webhook delivery mechanisms—how to format payloads, how to handle retries, how to sign requests with HMAC. We wrote elegant code for sending events *to* OpenClaw, as if we were a third-party service notifying their system about file changes.

The error messages started arriving almost immediately. Connection timeouts. 404s. Then silence, because of course that endpoint didn't exist.

I recall staring at the error logs, genuinely confused. "But it's an API," I said to myself, more than once. "APIs have endpoints. Why isn't this working?"

The answer, as it turned out, was that we'd been solving a problem that didn't exist. OpenClaw wasn't a cloud service waiting to receive webhooks. It was something entirely different—something that lived *locally*, on the same machine, running its own gateway that we needed to connect *to*, not *at*.

---

## The Revelation

The research phase that followed was humbling. We dove into documentation, searched GitHub repositories, traced through example code. And slowly, the picture became clear.

OpenClaw was a **self-hosted AI gateway**. It ran locally, on the user's machine, listening on `ws://127.0.0.1:18789` by default. Not HTTPS. Not HTTP. WebSocket—a persistent, bidirectional connection for real-time communication.

It had an **AgentSkills** system. Skills were JavaScript modules that extended OpenClaw's capabilities, living in the user's OpenClaw directory at `~/.openclaw/skills/`. These skills could make HTTP requests to other services—services that needed to expose their own APIs for the skills to call.

The integration direction was backwards from what we'd built. We weren't supposed to send webhooks *to* OpenClaw. We were supposed to:

1. **Listen** for events from OpenClaw (via WebSocket)
2. **Expose** an HTTP API that OpenClaw skills could invoke
3. **Hook** into StringRay's tool execution lifecycle to send events back

The architecture flipped completely. And we had to rebuild almost everything.

---

## The Rebuild

Starting from scratch is rarely fun, but this time it felt necessary. We were building on a foundation of misunderstandings, and you can't patch a cracked foundation—you have to pour a new one.

We created the integration in layers, each one dependent on the last:

**Layer One: The Types.** Before we could write any code, we needed to understand what we were dealing with. The OpenClaw Gateway Protocol v3 defined frame types—requests, responses, events—each with their own structure. We spent a full week just getting the TypeScript types right, defining guards to identify frame types, and mapping out the handshake parameters. This was the unsexy but essential work that made everything else possible.

**Layer Two: The WebSocket Client.** This was the core of our connection to OpenClaw. We built a client that could:
- Connect to `ws://127.0.0.1:18789`
- Send a handshake with protocol negotiation
- Maintain the connection with ping/pong heartbeats
- Handle request/response correlation (since WebSocket is asynchronous, every request needs an ID to match its response)
- Reconnect automatically when the connection drops

The client kept track of pending requests in a Map, using the request ID as the key. When a response arrived, it looked up the waiting promise and resolved or rejected it. Simple in concept, but tricky to get right—we had to handle timeouts, duplicate responses, and the edge case where the connection drops while a request is pending.

**Layer Three: The HTTP API Server.** This was the piece that made the integration *work*. OpenClaw skills needed a way to invoke StringRay capabilities, and HTTP was the answer. We built a server listening on port 18431 (chosen to avoid conflicts with common ports) that exposed endpoints like `/api/agent/invoke` and `/health`.

The server didn't know how to execute agents—that was StringRay's job. Instead, it accepted requests, validated them, and passed them to an `AgentInvoker` that StringRay provided. This separation kept our code clean and let StringRay control how agents actually ran.

**Layer Four: The Hooks.** StringRay emits events when tools execute—`tool.before` when a tool starts, `tool.after` when it completes. We built a hooks manager that could subscribe to these events and forward them to OpenClaw via the WebSocket connection. This let users monitor tool executions in real-time through their OpenClaw-connected chat interfaces.

---

## The Critical Fixes

The initial implementation worked, technically. The pieces connected. Data flowed. But there were problems hiding beneath the surface—problems that only revealed themselves under load, over time, or when things went wrong.

### The Memory Leak

We discovered this one during a long-running test session. The integration started fine, but after hours of operation, memory usage began climbing. Eventually, it would grind the process to a halt.

The culprit was event listener accumulation. When we wired the hooks to StringRay's tool events, we registered callbacks. But when the integration shut down—or when connections were reset—we never unregistered them. Each reconnection added new listeners without removing the old ones.

The fix was simple but easy to miss: store the unsubscribe functions returned by `mcpClientManager.onToolEvent()` and call them during shutdown. Now the integration properly cleans up after itself:

```typescript
this.mcpToolBeforeUnsubscribe = await mcpClientManager.onToolEvent('tool.before', ...);
// Later, during shutdown:
if (this.mcpToolBeforeUnsubscribe) {
  this.mcpToolBeforeUnsubscribe();
  this.mcpToolBeforeUnsubscribe = null;
}
```

### The Data Loss

In production, connections drop. That's a fact of distributed systems. But we hadn't accounted for what happened when the OpenClaw connection was lost mid-operation.

If StringRay executed a tool while OpenClaw was disconnected, that `tool.after` event simply... disappeared. No error, no retry, just gone. The user would never know their tool execution hadn't been logged.

We solved this with an offline event buffer. When the client isn't connected, events get queued in memory. When the connection is restored, the queue flushes automatically:

```typescript
if (this.client?.isConnected()) {
  await this.client.sendRequest('event.tool.after', hookEvent);
  await this.flushEventQueue();
} else {
  this.queueEvent('tool.after', hookEvent);
}
```

The queue has a maximum size (100 events) to prevent unbounded memory growth. Old events get dropped when new ones arrive if the queue is full—better to lose some data than crash the process.

### The Filter Gap

Early on, we forwarded *every* tool event to OpenClaw. But in practice, users often only care about specific tools. Sending everything was wasteful—bandwidth, processing, storage—all spent on data nobody wanted.

We added a `toolFilter` configuration option that lets users specify which tools should trigger events. If the filter is set, only matching tools generate hooks:

```typescript
if (this.config.toolFilter && !this.config.toolFilter.includes(event.toolName)) {
  return; // Skip this event
}
```

Simple, but it made the integration significantly more useful in real-world scenarios.

### The Silent Failures

There's a particular kind of frustration that comes from debugging something that fails silently. You check the logs, nothing looks wrong. You check the code, it seems fine. But things just... don't work.

That was happening with our event wiring. When the `tool.before` or `tool.after` handlers threw errors, they disappeared into the void. The event system didn't know how to report them, and we had no visibility into what was going wrong.

We added try-catch blocks inside the event handlers, logging errors before re-throwing or swallowing as appropriate:

```typescript
this.mcpToolBeforeUnsubscribe = await mcpClientManager.onToolEvent('tool.before', async (event) => {
  try {
    await this.hooksManager!.onToolBefore({ /* ... */ });
  } catch (error) {
    await this.log('error', `Error in tool.before handler: ${error}`);
  }
});
```

Now when something breaks, we know about it.

### The Missing Health Check

The final piece was visibility. When running health checks on the StringRay system, we needed to report the status of the OpenClaw integration—not just whether it was enabled, but whether it was actually connected and functioning.

We extended the health check to verify each component:
- Is the API server running?
- Is the WebSocket client connected?
- Are the hooks initialized?
- How many events are in the offline queue?

This gives operators a complete picture of the integration's health at a glance.

---

## The Testing Journey

I'll be honest: we didn't start with comprehensive tests. The initial implementation was exploratory—we were figuring out how OpenClaw worked, building incrementally, learning as we went. Tests seemed like something we'd add "later," when things settled down.

But things never settle down. And when we finally sat down to write tests, we discovered just how much we'd missed.

The test files revealed gaps everywhere:
- No tests for the offline buffering behavior
- No tests for tool filtering
- No tests for connection state transitions
- No tests for the API server endpoints

Writing the tests wasn't just about coverage—it was about understanding what the code was *supposed* to do. We'd built something that worked in the happy path, but what about edge cases? What happens when the client is already connected? What happens when the queue fills up?

Each test we wrote exposed another assumption we'd made, another behavior we hadn't considered. The tests became a design tool as much as a quality tool. They'd tell us when our code was doing something unintended, forcing us to clarify what "right" actually looked like.

---

## What We Learned

If I distill this experience down to what matters, three lessons stand out:

**Research before implementing.** Sounds obvious, right? We thought we understood OpenClaw based on its name and a surface-level glance. We were wrong in the most expensive way possible—building the wrong thing. The weeks we spent on that first implementation were essentially wasted. Now I ask: What's the simplest thing I can build to validate my understanding? What's the smallest test that would prove me right or wrong?

**Offline buffering matters for reliability.** This is true of almost any system that communicates over networks. Connections drop. Servers restart. The question isn't *if* you'll be disconnected, but *what happens when you are*. We chose to buffer events in memory and flush them when reconnected. In retrospect, this should have been there from day one. The cost of adding it later—rethinking the entire event flow—was much higher than designing for it from the start.

**Cleanup prevents memory leaks.** This is the lesson I keep coming back to. In JavaScript, it's easy to think of memory management as someone else's problem. But event listeners are references, and references prevent garbage collection. Every callback we registered without unregistering was a small memory leak, accumulating over time. The fix was simple—call the unsubscribe function—but the debugging was anything but. Now I treat cleanup as a first-class concern, not an afterthought.

---

## The Feeling

What stays with me most isn't the code or the architecture. It's the moment when everything clicked—when the WebSocket client connected on the first try, when the API server responded to a skill's request, when the hooks forwarded that first tool event and we saw it appear in the OpenClaw stream.

We'd been wrong about what we were building. We'd built the wrong thing twice. We'd faced moments of genuine confusion, when the error messages didn't make sense because our mental model was broken.

But we'd also figured it out. We'd done the research, accepted that our assumptions were wrong, and rebuilt from scratch. And in doing so, we'd created something that actually worked—something that could connect two systems in a meaningful way, handle failures gracefully, and clean up after itself.

That's the part I keep coming back to. Not the triumph of getting it right, but the process of getting there: the wrong turns, the revisions, the fixes that exposed deeper problems that required more fixes. The code we write isn't linear. It's iterative. It's learning in public, sometimes embarrassingly so.

And that's okay. That's how it's supposed to work.
