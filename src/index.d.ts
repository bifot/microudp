type callback = (data: object) => any;

declare class Socket {}

declare class UDP {
  public services: object;
  public timeout: number;
  public socketsCreated: boolean;

  public constructor(options?: {
    services?: {},
    timeout?: number
  });

  public on(event: string, callback: callback): this;
  public emit(event: string, data: object): this;
  public middleware(): (...args) => void;
  public ask(event: string, data: object, options?: { attempts?: number }): Promise<void>
  public createSockets(): Promise<void>;
  public listen(port: number, address?: string): Promise<Socket>;
}

export = UDP;
