import { getWrapped, WrappedError } from "@/lib/github";

const STATUS: Record<string, number> = {
  invalid: 400,
  not_found: 404,
  rate_limit: 429,
  unknown: 502,
};

export async function GET(request: Request) {
  const username = new URL(request.url).searchParams.get("username") ?? "";

  try {
    if (!username.trim()) {
      throw new WrappedError("invalid", "Add a GitHub handle first.");
    }
    const data = await getWrapped(username);
    return Response.json(
      { data },
      {
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    const wrapped = error instanceof WrappedError ? error : null;
    const code = wrapped?.code ?? "unknown";
    const message = wrapped?.message ?? "Something went sideways while reading GitHub.";

    if (!wrapped) console.error("[github-unwrapped]", error);

    return Response.json(
      { error: { code, message } },
      { status: STATUS[code] ?? 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
