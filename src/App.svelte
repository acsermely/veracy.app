<script lang="ts">
	import { ModeWatcher } from "mode-watcher";
	import { Route, Router } from "svelte-routing";
	import ActionBar from "./lib/components/common/ActionBar.svelte";
	import { Toaster } from "./lib/components/ui/sonner";
	import { setDialogsState } from "./lib/state/dialogs.svelte";
	import { setFeedState } from "./lib/state/feed.svelte";
	import { setWalletState } from "./lib/state/wallet.svelte";
	import { setContentNodeState } from "./lib/state/node.svelte";
	import { setSearchState } from "./lib/state/search.svelte";
	import Create from "./routes/Create.svelte";
	import Feed from "./routes/Feed.svelte";
	import Profile from "./routes/Profile.svelte";
	import Search from "./routes/Search.svelte";
	import SinglePost from "./routes/SinglePost.svelte";

	const feedState = setFeedState();
	setWalletState();
	setSearchState();
	const dialogState = setDialogsState();
	const nodeState = setContentNodeState();

	let url = $state("");
	let installPromt = $state<any>();

	nodeState.loginCheck().then(() => {
		dialogState.connectDialog = false;
	});

	feedState.queryData();

	function beforeInstall(event: any): void {
		installPromt = event;
	}

	// function install(): void {
	// 	installPromt.prompt().then((result: any) => {
	// 		console.log(result);
	// 	});
	// }
</script>

<ModeWatcher />
<svelte:window onbeforeinstallprompt={(event: any) => beforeInstall(event)} />

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
				<Feed />
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
