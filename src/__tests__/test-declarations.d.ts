// Type declarations for third-party modules
declare module 'msw' {
  export const rest: {
    get: typeof httpHandler;
    post: typeof httpHandler;
    put: typeof httpHandler;
    patch: typeof httpHandler;
    delete: typeof httpHandler;
  };
  export type RequestHandler = any;
  export type ResponseResolver = (req: any, res: any, ctx: any) => any;
}

declare module 'msw/node' {
  export function setupServer(...handlers: any[]): any;
}

declare function httpHandler(path: string, resolver: any): any;

declare module 'fishery' {
  interface Factory<T> {
    build(overrides?: Partial<T>): T;
    buildList(count: number, overrides?: Partial<T>): T[];
  }
  interface FactoryDefinition<T> {
    define(callback: (opts: { sequence: number; params: Partial<T> }) => T): Factory<T>;
  }
  const Factory: FactoryDefinition<any>;
  export { Factory };
}
