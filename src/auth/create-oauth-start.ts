import { NowRequest, NowResponse } from "@now/node";

import { OAuthStartOptions } from "../types";
import ShopifyError, { ErrorResponse } from "./errors";
import { DEFAULT_ACCESS_MODE, DEFAULT_MYSHOPIFY_DOMAIN, TOP_LEVEL_OAUTH_COOKIE_NAME } from "./index";
import oAuthQueryString from "./oauth-query-string";
import redirect from "../helpers/redirect";
import { destroyCookie } from "../helpers/nookies";

export default function createOAuthStart(options: OAuthStartOptions, callbackPath: string) {
	return function oAuthStart(req: NowRequest, res: NowResponse) {
		const config: OAuthStartOptions = {
			myShopifyDomain: DEFAULT_MYSHOPIFY_DOMAIN,
			accessMode: DEFAULT_ACCESS_MODE,
			prefix: "",
			scopes: [],
			...options,
		};
		const { myShopifyDomain } = config;
		const query = req.query as Record<string, string>;
		const { shop } = query;

		const shopRegex = new RegExp(
			`^[a-z0-9][a-z0-9\\-]*[a-z0-9]\\.${myShopifyDomain}$`,
			"i",
		);

		if (shop == null || !shopRegex.test(shop)) {
			const error: ErrorResponse = {
				errorMessage: ShopifyError.ShopParamMissing,
				shopOrigin: shop,
			};
			console.error(error);

			res.status(400).send(error);
			return;
		}

		destroyCookie({ res, name: TOP_LEVEL_OAUTH_COOKIE_NAME });

		const formattedQueryString = oAuthQueryString(req, res, config, callbackPath);

		return redirect({ res, location: `https://${shop}/admin/oauth/authorize?${formattedQueryString}` });
	};
}
