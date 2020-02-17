import { ServerResponse } from "http";

import { Routes } from "./types";
import { clearSession, redirectToAuth } from "./utilities";

export function loginAgain({
	shop,
	res,
	routes,
}: {
	shop?: string;
	res?: ServerResponse;
	routes: Routes;
}) {
	clearSession({ res });
	redirectToAuth({ shop, res, routes });
}
