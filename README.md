# `now-shopify-auth`

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Authenticate your [Next.js](https://nextjs.org/) app and [ZEIT Now](https://now.sh/) serverless functions with [Shopify](https://www.shopify.ca/).

## Installation

```bash
$ npm install -S now-shopify-auth
```

## Usage

### verifyRequest

#### in pages/_app.tsx

```typescript jsx
import App, { AppContext, AppProps } from "next/app";
import { parseCookies } from "nookies";
import { AppProvider } from "@shopify/polaris";
import { Loading, Provider } from "@shopify/app-bridge-react";
import { verifyRequest } from "now-shopify-auth";

const apiKey = "shopify api key";

class MyShopifyApp extends App<AppProps & { shopOrigin: string }> {
	static async getInitialProps({ Component, ctx }: AppContext) {
		const authRoute = "/api/shopify/auth";
        const fallbackRoute = "/login";
        const verifyTokenUrl = `https://myshopifyapp.com/api/shopify/verify-token`;
		const cookies = parseCookies(ctx);
		const shopOrigin = ctx.query.shop ?? cookies.shopOrigin;

		if (ctx.pathname !== fallbackRoute) {
            await verifyRequest({
                query: ctx.query,
                cookies,
                res: ctx.res,
                options: { authRoute, fallbackRoute, verifyTokenUrl },
            });
		}

		return {
			pageProps: {
				// Call page-level getInitialProps
				...(Component.getInitialProps ? await Component.getInitialProps(ctx) : {}),
			},
			shopOrigin,
		};
	}

	render() {
		const { Component, pageProps, shopOrigin } = this.props;

		if (!shopOrigin) {
			return (
                <AppProvider>
                    <Component {...pageProps} />
                </AppProvider>
			);
		}

		const forceRedirect = true;

		if (
			forceRedirect &&
			typeof window !== "undefined" &&
			window === window.parent
		) {
			window.location.href = `https://${shopOrigin}/admin/apps/${apiKey}${location.pathname}${location.search || ""}`;

			return <>Redirecting to Shopify</>;
		}

		const shopifyBridgeConfig: import("@shopify/app-bridge").AppConfig = {
			apiKey,
			shopOrigin,
			forceRedirect,
		};

		return (
            <AppProvider
                {...shopifyBridgeConfig}
            >
                <Provider config={shopifyBridgeConfig}>
                    <Loading />
                    <Component {...pageProps} />
                </Provider>
            </AppProvider>
		);
	}
}
```

#### in pages/api/hello-word.ts

```typescript
import { NowRequest, NowResponse } from "@now/node";
import { verifyRequest } from "now-shopify-auth";

export default async function sendTestNotification(req: NowRequest, res: NowResponse): Promise<void> {
    const authRoute = "/api/shopify/auth";
    const fallbackRoute = "/login";
    const verifyTokenUrl = `https://myshopifyapp.com/api/shopify/verify-token`;

	await verifyRequest({ query: req.query, cookies: req.cookies, res, options: { authRoute, fallbackRoute, verifyTokenUrl } });
}
```

### createShopifyAuth

Returns a set of helpers that you will need to use in 4 different routes explained below.

```typescript
import createShopifyAuth, { OAuthStartOptions } from "now-shopify-auth";

const shopifyAuthOptions: OAuthStartOptions = {
    // your shopify app api key
	apiKey: "SHOPIFY_API_KEY",
    // your shopify app secret
	secret: "SHOPIFY_API_SECRET_KEY",
    // your app url
	appUrl: "https://myshopifyapp.com",
    // if specified, mounts the routes off of the given path
    // eg. /api/shopify/auth, /api/shopify/auth/callback
    // defaults to ""
	prefix: "/api/shopify",
    // scopes to request on the merchants store
	scopes: ["read_products", "read_orders"],
    // set access mode, default is "online"
    accessMode: "offline",
    // callback for when auth is completed
	async afterAuth({ shopOrigin, shopifyToken, res }) {
		console.log(`We're authenticated on shop ${shopOrigin}: ${shopifyToken}`);

        res.writeHead(302, { Location: `https://${shopOrigin}/admin/apps/${apiKey}` });
		res.end();
	},
};
```

### Required routes

In a Next.js app, you will need to create these 5 routes:
 - /api/shopify/auth/callback
 - /api/shopify/auth/enable-cookies
 - /api/shopify/auth/index
 - /api/shopify/auth/inline
 - /api/shopify/verify-token

Theses files will need the following content for the authentication and verification processes to work as expected

#### /api/shopify/auth/callback

```typescript
import { NowRequest, NowResponse } from "@now/node";
import createShopifyAuth from "now-shopify-auth";

import { shopifyAuthOptions } from "../../../config";

export default async function shopifyAuthCallback(req: NowRequest, res: NowResponse): Promise<void> {
	const { oAuthCallback } = createShopifyAuth(shopifyAuthOptions);

	await oAuthCallback(req, res);
}
```

#### /api/shopify/auth/enable-cookies

```typescript
import { NowRequest, NowResponse } from "@now/node";
import createShopifyAuth from "now-shopify-auth";

import { shopifyAuthOptions } from "../../../config";

export default async function shopifyAuthEnableCookies(req: NowRequest, res: NowResponse): Promise<void> {
	const { enableCookies } = createShopifyAuth(shopifyAuthOptions);

	await enableCookies(req, res);
}
```

#### /api/shopify/auth/index

```typescript
import { NowRequest, NowResponse } from "@now/node";
import createShopifyAuth, { hasCookieAccess, shouldPerformInlineOAuth } from "now-shopify-auth";

import { shopifyAuthOptions } from "../../../config";

export default async function shopifyAuthIndex(req: NowRequest, res: NowResponse): Promise<void> {
	const {
		enableCookiesRedirect,
		oAuthStart,
		topLevelOAuthRedirect,
	} = createShopifyAuth(shopifyAuthOptions);

	if (!hasCookieAccess(req.cookies)) {
		await enableCookiesRedirect(req, res);
		return;
	}

	if (shouldPerformInlineOAuth(req.cookies)) {
		await oAuthStart(req, res);
		return;
	}

	await topLevelOAuthRedirect(req, res);
}
```

#### /api/shopify/auth/inline

```typescript
import { NowRequest, NowResponse } from "@now/node";
import createShopifyAuth from "now-shopify-auth";

import { shopifyAuthOptions } from "../../../config";

export default async function shopifyAuthInline(req: NowRequest, res: NowResponse): Promise<void> {
	const { oAuthStart } = createShopifyAuth(shopifyAuthOptions);

	await oAuthStart(req, res);
}
```

#### /api/shopify/verify-token

This is a simple proxy route to avoid CORS issues we would face by hitting Shopify API from a different domain

```typescript
import { NowRequest, NowResponse } from "@now/node";
import fetch from "isomorphic-fetch";

export default async function verifyToken(req: NowRequest, res: NowResponse): Promise<void> {
	const { shopOrigin, shopifyToken } = req.cookies;

    const response = await fetch(
	    `https://${shopOrigin}/admin/metafields.json`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": shopifyToken,
            },
        },
    );

    res.status(response.status).end();
}
```

## Gotchas

Make sure to install a fetch polyfill, since internally we use it to make HTTP requests.

In your terminal
`$ npm install -S isomorphic-fetch`

In your app
`import "isomorphic-fetch"`

OR

`require("isomorphic-fetch")`
