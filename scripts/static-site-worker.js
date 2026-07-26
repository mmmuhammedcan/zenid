export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const requestUrl = new URL(request.url);
    const providerRootRedirect =
      response.status >= 300 &&
      response.status < 400 &&
      response.headers.get("location") === "/" &&
      requestUrl.pathname !== "/";
    if (
      (response.status !== 404 && !providerRootRedirect) ||
      (request.method !== "GET" && request.method !== "HEAD")
    ) {
      return response;
    }

    const fallbackUrl = new URL("/index.html", requestUrl.origin);
    return env.ASSETS.fetch(new Request(fallbackUrl, request));
  },
};
