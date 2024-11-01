<script lang="ts">
	import { ModeWatcher } from "mode-watcher";
	import { Route, Router } from "svelte-routing";
	import ActionBar from "./lib/components/ActionBar.svelte";
	import Main from "./lib/components/Main.svelte";
	import Profile from "./lib/components/Profile.svelte";

	import { Loader } from "lucide-svelte";
	import Create from "./lib/components/Create.svelte";
	import MainPost from "./lib/components/MainPost.svelte";
	import { Toaster } from "./lib/components/ui/sonner";
	import { ArweaveUtils } from "./lib/data/Arweave.data";
	import type { Post } from "./lib/model/post.model";
	import { setDialogsState } from "./lib/state/dialogs.svelte";
	import { setFeedState } from "./lib/state/feed.svelte";
	import { setLocalWalletState } from "./lib/state/local-wallet.svelte";
	import { setContentNodeState } from "./lib/state/node.svelte";

	setFeedState();
	setLocalWalletState();
	setDialogsState();
	const nodeState = setContentNodeState();

	let url = $state("");

	nodeState.loginCheck();
</script>

<ModeWatcher />
<div class="flex w-[100dvw] h-[100dvh] flex-col-reverse md:flex-row">
	<div class="flex flex-col-reverse mb-3 md:mb-0 md:flex-col justify-between">
		<ActionBar />
	</div>
	<div class="flex-1 flex justify-center overflow-x-auto">
		<Router {url}>
			<Route path="/">
				<Main />
			</Route>
			<Route path="/p/:id" let:params>
				<Profile walletId={params.id} />
			</Route>
			<Route path="/create">
				<Create />
			</Route>
			<Route path="/post/:id" let:params>
				<div
					class="flex-1 flex w-full h-full items-center justify-center"
				>
					{#await ArweaveUtils.getTxById<Post>(params.id)}
						<Loader class="size-10 animate-spin" />
					{:then data}
						<MainPost {data} txId={params.id} />
					{/await}
				</div>
			</Route>
		</Router>
	</div>
</div>
<Toaster richColors expand={true} position="top-center" />
