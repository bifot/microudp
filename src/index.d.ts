type legacyCallback = (data: object) => any;
type advancedCallback = (udp: UDP, data: object) => any;

declare class Socket {}

declare class UDP {
  public services: object;
  public timeout: number;
  public socketsCreated: boolean;

  public constructor(options?: {
    services?: object,
    timeout?: number
  });

  public on(event: string, callback: legacyCallback | advancedCallback): this;
  public emit(event: string, data?: any): this;
  public middleware(): (...args) => void;
  public ask(event: string, data?: any, options?: { attempts?: number }): Promise<any>
  public createSockets(): this;
  public listen(port: number, host?: string): Promise<Socket>;
}

export = UDP;
