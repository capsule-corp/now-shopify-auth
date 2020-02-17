import { ServerResponse } from "http";
import { Header, Method, StatusCode } from "@shopify/network";

import { Routes } from "./types";
import { redirectToAuth } from "./utilities";
import { TEST_COOKIE_NAME, TOP_LEVEL_OAUTH_COOKIE_NAME } from "../auth";
import { destroyCookie, setCookie } from "../helpers/nookies";

export async function verifyToken({
	shopOrigin,
	shopifyToken,
	res,
	routes,
	verifyTokenUrl,
}: {
	shopOrigin?: string;
	shopifyToken?: string;
	res?: ServerResponse;
	routes: Routes;
	verifyTokenUrl: string;
}) {
	if (shopOrigin && shopifyToken) {
		destroyCookie({ res, name: TOP_LEVEL_OAUTH_COOKIE_NAME });
		const isServer = typeof res !== "undefined";
		const isomorphicFetch = typeof fetch !== "undefined" ? fetch : (await import("isomorphic-fetch")).default;
		// If a user has installed the store previously on their shop, the accessToken can be stored in session.
		// we need to check if the accessToken is valid, and the only way to do this is by hitting the api.
		const response = isServer ?
			await isomorphicFetch(
				`https://${shopOrigin}/admin/metafields.json`,
				{
					method: Method.Get,
					headers: {
						[Header.ContentType]: "application/json",
						"X-Shopify-Access-Token": shopifyToken,
					},
				},
			) :
			await isomorphicFetch(
				verifyTokenUrl,
				{
					method: Method.Get,
					credentials: "include",
				},
			);

		if (response.status === StatusCode.Unauthorized) {
			redirectToAuth({ shop: shopOrigin, res, routes });
			return;
		}

		return;
	}

	setCookie({ res, name: TEST_COOKIE_NAME, value: "1" });

	redirectToAuth({ shop: shopOrigin, res, routes });
}
