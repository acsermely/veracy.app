import type { ArBucketItems, ArPostIdResult } from "./arweave.utils";

export function userCountPerPostProcessor(
	edges: ArBucketItems[],
): ArPostIdResult[] {
	const result = new Map<
		string,
		{ votes: Set<string>; data: ArBucketItems }
	>();
	let txId: string | undefined;
	for (let i = 0; i < edges.length; i++) {
		const item = edges[i];
		txId = item.node.tags.find((tag) => tag.name === "PostTx")?.value;
		if (!txId) {
			continue;
		}
		if (!result.has(txId)) {
			result.set(txId, {
				votes: new Set<string>(),
				data: item,
			});
		}
		result.get(txId)!.votes.add(item.node.address);
	}
	return Array.from(result.entries())
		.sort((a, b) => b[1].votes.size - a[1].votes.size)
		.map(([id, value]) => ({
			id,
			cursor: edges[edges.length - 1].cursor,
			timestamp: value.data.node.timestamp,
		}));
}
