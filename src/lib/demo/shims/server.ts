// Ersatz für next/server in der Browser-Demo (Route Handler laufen im Browser).
export class NextResponse extends Response {
  static json(body: unknown, init?: ResponseInit) {
    return new NextResponse(JSON.stringify(body), { ...init, headers: { "Content-Type": "application/json", ...(init?.headers as Record<string, string>) } });
  }
  static redirect(url: string | URL, status = 307) {
    return new NextResponse(null, { status, headers: { Location: String(url) } });
  }
  static next() {
    return new NextResponse(null);
  }
}

export const NextRequest = Request;

export function after(task: (() => unknown) | Promise<unknown>) {
  setTimeout(() => void (typeof task === "function" ? task() : task), 0);
}

export async function connection() {}
