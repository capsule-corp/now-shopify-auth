import { ServerResponse } from "http";

export type AccessMode = "online" | "offline";

export interface AuthConfig {
	secret: string;
	apiKey: string;
	myShopifyDomain?: string;
	accessMode?: "online" | "offline";

	afterAuth?(params: { shopOrigin: string; shopifyToken: string; res: ServerResponse; }): void;
}

export interface OAuthStartOptions extends AuthConfig {
	prefix?: string;
	scopes?: string[];
	appUrl: string;
}
