<script lang="ts">
	import { type Post, type PostContent } from "../model/post.model";
	import { getLocalWalletState } from "../state/local-wallet.svelte";
	import MainPost from "./MainPost.svelte";

	const walletState = getLocalWalletState();

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
