import test from "node:test";
import assert from "node:assert/strict";
import worker from "./static-site-worker.js";

function assetEnvironment(routes) {
  const requests = [];
  return {
    requests,
    env: {
      ASSETS: {
        async fetch(request) {
          const url = new URL(request.url);
          requests.push({ method: request.method, pathname: url.pathname });
          return routes[url.pathname] || new Response("missing", { status: 404 });
        },
      },
    },
  };
}

test("serves an existing static asset without a fallback request", async () => {
  const fixture = assetEnvironment({
    "/assets/app.js": new Response("app", { status: 200 }),
  });
  const response = await worker.fetch(
    new Request("https://zenid.example/assets/app.js"),
    fixture.env
  );

  assert.equal(response.status, 200);
  assert.deepEqual(fixture.requests, [{ method: "GET", pathname: "/assets/app.js" }]);
});

test("serves the application shell for an unknown SPA route", async () => {
  const fixture = assetEnvironment({
    "/index.html": new Response("<main>ZenID</main>", {
      status: 200,
      headers: { "content-type": "text/html" },
    }),
  });
  const response = await worker.fetch(
    new Request("https://zenid.example/portfolio"),
    fixture.env
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "<main>ZenID</main>");
  assert.deepEqual(fixture.requests, [
    { method: "GET", pathname: "/portfolio" },
    { method: "GET", pathname: "/index.html" },
  ]);
});

test("does not convert an unsupported write request into an application page", async () => {
  const fixture = assetEnvironment({});
  const response = await worker.fetch(
    new Request("https://zenid.example/upload", { method: "POST" }),
    fixture.env
  );

  assert.equal(response.status, 404);
  assert.deepEqual(fixture.requests, [{ method: "POST", pathname: "/upload" }]);
});
