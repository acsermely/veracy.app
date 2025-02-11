<script lang="ts">
	import { ChevronLeft, Loader } from "lucide-svelte";
	import { navigate } from "svelte-routing";
	import FeedPost from "../feed/FeedPost.svelte";
	import { Button } from "../ui/button";
	import type { Post } from "../../models/post.model";
	import { getContentNodeState, getDialogsState } from "../../state";
	import { ArweaveUtils } from "../../utils/arweave.utils";

	const { id }: { id: string } = $props();

	const nodeState = getContentNodeState();
	const dialogsState = getDialogsState();
</script>

<div
	class="flex flex-col w-full max-w-[450px] items-center m-3 overflow-y-auto no-scrollbar no-scrollbar::-webkit-scrollbar"
>
	<div class="flex mb-3 w-full justify-between items-baseline">
		<Button
			variant="outline"
			size="icon"
			onclick={() => {
				navigate("/");
			}}><ChevronLeft /></Button
		>
	</div>
	<div class="flex-1 flex w-full justify-center">
		{#await ArweaveUtils.getTxById<Post>(id)}
			<Loader class="mt-20 size-10 animate-spin" />
		{:then data}
			<FeedPost {data} txId={id} />
		{/await}
	</div>
</div>
