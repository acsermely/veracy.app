import type { PostContent } from "../models/post.model";

export function runDelayed(fn: () => void, ms: number = 1): void {
	const timeout = setTimeout(() => {
		fn();
		clearTimeout(timeout);
	}, ms);
}

export function hasPrivateContent(data: Partial<PostContent>[]): boolean {
	return !!data.filter((content) => {
		return content?.privacy === "PRIVATE";
	}).length;
}

export function downloadFile(
	name: string,
	content: any,
	type: "text/plain" | "application/json",
): void {
	const a = document.createElement("a");
	a.href = URL.createObjectURL(
		new Blob([content], {
			type,
		}),
	);
	a.setAttribute("download", name);
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

export async function createSHA256Hash(data: string): Promise<string> {
	const encoder = new TextEncoder();
	const dataArray = encoder.encode(data);
	const hashBuffer = await crypto.subtle.digest("SHA-256", dataArray);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
	return hashHex;
}
