// Type declarations for third-party modules without types

declare module 'yaml' {
  export function parse(str: string, options?: Record<string, unknown>): unknown;
  export function stringify(value: unknown, options?: Record<string, unknown>): string;
  export function dump(value: unknown, options?: Record<string, unknown>): string;
}

declare module 'ws' {
  import { EventEmitter } from 'events';
  import { Server as HttpServer } from 'http';

  export const OPEN: number;
  export const CLOSED: number;
  export const CLOSING: number;
  export const CONNECTING: number;

  class WebSocket extends EventEmitter {
    static readonly OPEN: number;
    static readonly CLOSED: number;
    static readonly CLOSING: number;
    static readonly CONNECTING: number;
    readonly readyState: number;
    constructor(address: string | URL, protocols?: string | string[], options?: Record<string, unknown>);
    on(event: string, listener: (...args: any[]) => void): this;
    once(event: string, listener: (...args: any[]) => void): this;
    send(data: string | Buffer | ArrayBuffer | ArrayBufferView, cb?: (err?: Error) => void): void;
    close(code?: number, reason?: string): void;
    ping(data?: string | Buffer | ArrayBuffer | ArrayBufferView, mask?: boolean, cb?: (err?: Error) => void): void;
    pong(data?: string | Buffer | ArrayBuffer | ArrayBufferView, mask?: boolean, cb?: (err?: Error) => void): void;
    terminate(): void;
    removeAllListeners(event?: string): this;
  }

  export { WebSocket };
  export default WebSocket;
}
