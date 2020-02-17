import { ServerResponse } from "http";

import { Routes } from "./types";
import { destroyCookie } from "../helpers/nookies";
import redirect from "../helpers/redirect";

export function clearSession({ res }: { res?: ServerResponse }) {
	destroyCookie({ res, name: "shopSettingsId" });
	destroyCookie({ res, name: "shopOrigin" });
	destroyCookie({ res, name: "shopifyToken" });
}

export function redirectToAuth(
	{
		shop,
		res,
		routes: {
			fallbackRoute,
			authRoute,
		},
	}: {
		shop?: string;
		res?: ServerResponse;
		routes: Routes;
	},
) {
	const routeForRedirect = typeof shop === "undefined" ? fallbackRoute : `${authRoute}?shop=${shop}`;

	redirect({ res, location: routeForRedirect });
}
