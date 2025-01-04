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

