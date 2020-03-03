import { NowRequest, NowResponse } from "@now/node";
import querystring from "querystring";

import { AuthConfig } from "../types";
import ShopifyError, { ErrorResponse } from "./errors";
import validateHmac from "./validate-hmac";

export default function createOAuthCallback(config: AuthConfig) {
	return async function oAuthCallback(req: NowRequest, res: NowResponse) {
		const query = req.query as Record<string, string>;
		const { code, hmac, shop, state: nonce } = query;
		const { apiKey, secret, afterAuth } = config;

		if (nonce == null || req.cookies.shopifyNonce !== nonce) {
			const error: ErrorResponse = {
				errorMessage: ShopifyError.NonceMatchFailed,
				shopOrigin: shop,
			};
			console.error(error);

			res.status(403).send(error);
			return;
		}

		if (shop == null) {
			const error: ErrorResponse = {
				errorMessage: ShopifyError.ShopParamMissing,
				shopOrigin: shop,
			};
			console.error(error);

			res.status(400).send(error);
			return;
		}

		if (!validateHmac(hmac, secret, query)) {
			const error: ErrorResponse = {
				errorMessage: ShopifyError.InvalidHmac,
				shopOrigin: shop,
			};
			console.error(error);

			res.status(400).send(error);
			return;
		}

		const accessTokenQuery = querystring.stringify({
			code,
			client_id: apiKey,
			client_secret: secret,
		});

		const accessTokenResponse = await fetch(
			`https://${shop}/admin/oauth/access_token`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					"Content-Length": Buffer.byteLength(accessTokenQuery).toString(),
				},
				body: accessTokenQuery,
			},
		);

		if (!accessTokenResponse.ok) {
			const error: ErrorResponse = {
				errorMessage: ShopifyError.AccessTokenFetchFailure,
				shopOrigin: shop,
			};
			console.error(error);

			res.status(401).send(error);
			return;
		}

		const accessTokenData = await accessTokenResponse.json();
		const { access_token: accessToken } = accessTokenData;

		if (afterAuth) {
			await afterAuth({ shopOrigin: shop, shopifyToken: accessToken, req, res });
		}
	};
}
