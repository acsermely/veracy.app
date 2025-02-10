<script lang="ts">
	import { ModeWatcher } from "mode-watcher";
	import { Route, Router } from "svelte-routing";
	import ActionBar from "./lib/components/common/ActionBar.svelte";
	import { Toaster } from "./lib/components/ui/sonner";
	import { setDialogsState } from "./lib/state/dialogs.svelte";
	import { setFeedState } from "./lib/state/feed.svelte";
	import { setContentNodeState } from "./lib/state/node.svelte";
	import { setSearchState } from "./lib/state/search.svelte";
	import { setWalletState } from "./lib/state/wallet.svelte";
	import { setWatcherState } from "./lib/state/watcher.svelte";
	import Create from "./routes/Create.svelte";
	import Feed from "./routes/Feed.svelte";
	import PrivacyPolicy from "./routes/PrivacyPolicy.svelte";
	import Profile from "./routes/Profile.svelte";
	import Search from "./routes/Search.svelte";
	import SinglePost from "./routes/SinglePost.svelte";
	import TermsOfUse from "./routes/TermsOfUse.svelte";

	const feedState = setFeedState();
	setWalletState();
	setSearchState();
	const dialogState = setDialogsState();
	const nodeState = setContentNodeState();
	setWatcherState();

	let url = $state("");
	let installPromt = $state<any>();

	$effect(() => {
		if (["/terms-of-use", "/privacy-policy"].includes(location.pathname)) {
			dialogState.connectDialog = false;
			return;
		}
		nodeState.loginCheck().catch(() => {
			dialogState.connectDialog = true;
		});
	});

	feedState.queryData();

	function beforeInstall(event: any): void {
		installPromt = event;
	}
</script>

<ModeWatcher />
<svelte:window onbeforeinstallprompt={(event: any) => beforeInstall(event)} />

<div
	class="bg-inherit flex w-[100dvw] h-[100dvh] flex-col-reverse md:flex-row overflow-hidden"
>
	<div
		class="flex flex-col-reverse standalone:mb-4 md:mb-0 md:flex-col justify-between"
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
			<Route path="/terms-of-use">
				<TermsOfUse />
			</Route>
			<Route path="/privacy-policy">
				<PrivacyPolicy />
			</Route>
		</Router>
	</div>
</div>
<Toaster richColors expand={true} position="top-center" duration={2000} />
