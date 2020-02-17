import { NowRequest, NowResponse } from "@now/node";
import querystring from "querystring";
// @ts-ignore
import nonce from "nonce";

import { OAuthStartOptions } from "../types";
import { setCookie } from "../helpers/nookies";

const createNonce = nonce() as () => number;

export default function oAuthQueryString(
	req: NowRequest,
	res: NowResponse,
	options: OAuthStartOptions,
	callbackPath: string,
) {
	const { scopes = [], apiKey, accessMode, appUrl } = options;

	const requestNonce = createNonce();
	setCookie({ res, name: "shopifyNonce", value: requestNonce.toString() });

	const redirectParams: Record<string, string> = {
		state: requestNonce.toString(),
		scope: scopes.join(", "),
		client_id: apiKey,
		redirect_uri: `https://${appUrl}${callbackPath}`,
	};

	if (accessMode === "online") {
		redirectParams["grant_options[]"] = "per-user";
	}

	return querystring.stringify(redirectParams);
}
