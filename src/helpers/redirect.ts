import { ServerResponse } from "http";

export default function redirect({ res, location }: { res?: ServerResponse, location: string }): void {
	if (res) {
		res.writeHead(302, { Location: location });
		return res.end();
	}

	if (typeof window !== "undefined") {
		document.location.pathname = location;
	}
}