<script lang="ts">
	import { type Post, type PostContent } from "../../models/post.model";
	import { getWalletState } from "../../state/wallet.svelte";
	import MainPost from "../feed/FeedPost.svelte";

	const walletState = getWalletState();

	const {
		data,
		title,
		price,
		tags,
	}: {
		data: Partial<PostContent>[];
		title?: string;
		price?: string;
		tags?: string[];
	} = $props();

	const previewPost = $derived({
		id: "",
		content: data,
		uploader: walletState.address,
		title,
		price,
		tags,
	} as Post);
</script>

<div class="flex-1 flex flex-col items-center w-full max-h-full">
	<MainPost data={previewPost} isPreview></MainPost>
</div>
