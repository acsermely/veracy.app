<script lang="ts">
	import { ModeWatcher } from "mode-watcher";
	import { Route, Router } from "svelte-routing";
	import ActionBar from "./lib/components/ActionBar.svelte";
	import Main from "./lib/components/Main.svelte";
	import Profile from "./lib/components/Profile.svelte";
	import { setWalletState } from "./lib/state/wallet.svelte";

	import ConnectDialog from "./lib/components/ConnectDialog.svelte";
	import Create from "./lib/components/Create.svelte";
	import { Toaster } from "./lib/components/ui/sonner";
	import { setFeedState } from "./lib/state/feed.svelte";
	import { setContentNodeState } from "./lib/state/node.svelte";
	setFeedState();
	setWalletState();
	const nodeState = setContentNodeState();

	let url = $state("");

	$effect(() => {
		nodeState.loginCheck();
	});
</script>

<ModeWatcher />
<div class="flex w-[100dvw] h-[100dvh] flex-col-reverse md:flex-row">
	<div class="flex flex-col-reverse md:flex-col justify-between">
		<ActionBar />
		<ConnectDialog />
	</div>
	<div class="flex-1 flex justify-center overflow-scroll">
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
		</Router>
	</div>
</div>
<Toaster richColors position="top-right" />
