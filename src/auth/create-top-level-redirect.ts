import { NowRequest, NowResponse } from "@now/node";
import querystring from "querystring";

import redirectionPage from "./redirection-page";

export default function createTopLevelRedirect(apiKey: string, path: string, appUrl: string) {
	return function topLevelRedirect(req: NowRequest, res: NowResponse) {
		const query = req.query as Record<string, string>;
		const params = { shop: query.shop };
		const queryString = querystring.stringify(params);

		res.send(redirectionPage({
			origin: query.shop,
			redirectTo: `https://${appUrl}${path}?${queryString}`,
			apiKey,
		}));
	};
}
