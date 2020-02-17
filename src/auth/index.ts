import { AccessMode, OAuthStartOptions } from "../types";
import createEnableCookiesRedirect from "./create-enable-cookies-redirect";
import createOAuthStart from "./create-oauth-start";
import createTopLevelOAuthRedirect from "./create-top-level-oauth-redirect";
import createOAuthCallback from "./create-oauth-callback";
import createEnableCookies from "./create-enable-cookies";

export const TOP_LEVEL_OAUTH_COOKIE_NAME = "shopifyTopLevelOAuth";
export const TEST_COOKIE_NAME = "shopifyTestCookie";

export const DEFAULT_MYSHOPIFY_DOMAIN = "myshopify.com";
export const DEFAULT_ACCESS_MODE: AccessMode = "online";

export function hasCookieAccess(cookies: Record<string, string>) {
	return Boolean(cookies[TEST_COOKIE_NAME]);
}

export function shouldPerformInlineOAuth(cookies: Record<string, string>) {
	return Boolean(cookies[TOP_LEVEL_OAUTH_COOKIE_NAME]);
}

export default function createShopifyAuth(options: OAuthStartOptions) {
	const config: OAuthStartOptions = {
		myShopifyDomain: DEFAULT_MYSHOPIFY_DOMAIN,
		accessMode: DEFAULT_ACCESS_MODE,
		prefix: "",
		scopes: [],
		...options,
	};

	return {
		enableCookiesRedirect: createEnableCookiesRedirect(config.apiKey, `${config.prefix}/auth/enable-cookies`, options.appUrl),
		oAuthStart: createOAuthStart(config, `${config.prefix}/auth/callback`),
		topLevelOAuthRedirect: createTopLevelOAuthRedirect(config.apiKey, `${config.prefix}/auth/inline`, options.appUrl),
		oAuthCallback: createOAuthCallback(options),
		enableCookies: createEnableCookies(options),
	};
}