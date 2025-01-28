<script lang="ts">
	import {
		type Post,
		type PostAge,
		type PostContent,
	} from "../../models/post.model";
	import { getWalletState } from "../../state/wallet.svelte";
	import MainPost from "../feed/FeedPost.svelte";

	const walletState = getWalletState();

	const {
		data,
		age,
		price,
		tags,
	}: {
		data: Partial<PostContent>[];
		age?: PostAge;
		price?: string;
		tags?: string[];
	} = $props();

	const previewPost = $derived({
		id: "",
		content: data,
		uploader: walletState.wallet?.address,
		age,
		price,
		tags,
	} as Post);
</script>

<div class="flex-1 flex flex-col items-center w-full max-h-full">
	<MainPost data={previewPost} isPreview></MainPost>
</div>
