export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function wrap(fn: (req: any, res: any) => void | Promise<void>) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
}
