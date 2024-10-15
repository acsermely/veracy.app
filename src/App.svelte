<script lang="ts">
	import { ModeWatcher } from "mode-watcher";
	import ActionBar from "./lib/components/ActionBar.svelte";
	import Main from "./lib/components/Main.svelte";
	import { Router, Route } from "svelte-routing";
	import Profile from "./lib/components/Profile.svelte";
	import { setWalletState } from "./lib/state/wallet.svelte";

	import { setContentNodeState } from "./lib/state/node.svelte";
	import { setFeedState } from "./lib/state/feed.svelte";
	import ConnectDialog from "./lib/components/ConnectDialog.svelte";
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
		</Router>
	</div>
</div>
