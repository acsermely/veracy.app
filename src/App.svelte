<script lang="ts">
	import { ModeWatcher } from "mode-watcher";
	import { Route, Router } from "svelte-routing";
	import ActionBar from "./lib/components/ActionBar.svelte";
	import Main from "./lib/components/Main.svelte";
	import Profile from "./lib/components/Profile.svelte";

	import Create from "./lib/components/Create.svelte";
	import Search from "./lib/components/Search.svelte";
	import SinglePost from "./lib/components/SinglePost.svelte";
	import { Toaster } from "./lib/components/ui/sonner";
	import { setDialogsState } from "./lib/state/dialogs.svelte";
	import { setFeedState } from "./lib/state/feed.svelte";
	import { setLocalWalletState } from "./lib/state/local-wallet.svelte";
	import { setContentNodeState } from "./lib/state/node.svelte";
	import { setUserStorageState } from "./lib/state/user-storage.svelte";

	const feedState = setFeedState();
	setLocalWalletState();
	setUserStorageState();
	const dialogState = setDialogsState();
	const nodeState = setContentNodeState();

	let url = $state("");

	nodeState.loginCheck().catch(() => {
		dialogState.connectDialog = true;
	});

	feedState.queryData();
</script>

<ModeWatcher />
<div
	class="bg-inherit flex w-[100dvw] h-[100dvh] flex-col-reverse md:flex-row overflow-hidden"
>
	<div
		class="flex flex-col-reverse standalone:mb-6 md:mb-0 md:flex-col justify-between"
	>
		<ActionBar />
	</div>
	<div class="flex-1 flex justify-center overflow-hidden">
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
				<SinglePost id={params.id} />
			</Route>
			<Route path="/search">
				<Search />
			</Route>
		</Router>
	</div>
</div>
<Toaster richColors expand={true} position="top-center" />
