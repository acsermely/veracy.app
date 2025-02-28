<script lang="ts">
	import { ModeWatcher } from "mode-watcher";
	import { Route, Router } from "svelte-routing";
	import { toast } from "svelte-sonner";
	import Chat from "./lib/components/chat/Chat.svelte";
	import ActionBar from "./lib/components/common/ActionBar.svelte";
	import PrivacyPolicy from "./lib/components/common/PrivacyPolicy.svelte";
	import Profile from "./lib/components/common/profile/Profile.svelte";
	import TermsOfUse from "./lib/components/common/TermsOfUse.svelte";
	import Create from "./lib/components/create/Create.svelte";
	import Feed from "./lib/components/feed/Feed.svelte";
	import SinglePost from "./lib/components/post/SinglePost.svelte";
	import Search from "./lib/components/search/Search.svelte";
	import { Toaster } from "./lib/components/ui/sonner";
	import { setAppState } from "./lib/state";
	import { setChatState } from "./lib/state/chat.svelte";
	import { setDialogsState } from "./lib/state/dialogs.svelte";
	import { setFeedState } from "./lib/state/feed.svelte";
	import { setContentNodeState } from "./lib/state/node.svelte";
	import { setSearchState } from "./lib/state/search.svelte";
	import { setWalletState } from "./lib/state/wallet.svelte";
	import { setWatcherState } from "./lib/state/watcher.svelte";
	import { runDelayed } from "./lib/utils/common.utils";
	import { DB } from "./lib/utils/db.utils";

	const feedState = setFeedState();
	setWalletState();
	setSearchState();
	const dialogState = setDialogsState();
	const nodeState = setContentNodeState();
	setWatcherState();
	const appState = setAppState();
	const chatState = setChatState();

	let url = $state("");
	let pollInterval: number | undefined;

	$effect(() => {
		// Start polling every minute
		pollInterval = window.setInterval(() => {
			nodeState.getNodeInfo().then((data) => {
				const newCount = data.inboxCount || 0;
				if (newCount > chatState.inboxCount) {
					toast.success(`You have ${newCount} new messages`);
				}
				chatState.setInboxCount(newCount);
			});
		}, 30000);

		// Cleanup on destroy
		return () => {
			if (pollInterval) {
				clearInterval(pollInterval);
				pollInterval = undefined;
			}
		};
	});

	$effect(() => {
		if (["/terms-of-use", "/privacy-policy"].includes(location.pathname)) {
			dialogState.connectDialog = false;
			return;
		}
		nodeState
			.getNodeInfo()
			.then((data) => {
				appState.imageSize = data.imageSize;
				appState.imageWidth = data.imageWidth;
				const newCount = data.inboxCount || 0;
				if (newCount > 0) {
					toast.success(`You have ${newCount} new messages`);
				}
				chatState.setInboxCount(newCount);
			})
			.catch(() => {
				dialogState.connectDialog = true;
			});
	});

	feedState.queryData();

	function beforeInstall(event: any): void {
		appState.installPrompt = event;
	}

	// Run profile cache eviction after 10s
	runDelayed(() => {
		DB.profile.evictStale().catch((e) => {
			console.error("Failed to evict stale profiles:", e);
		});
	}, 10000);
</script>

<ModeWatcher />
<svelte:window onbeforeinstallprompt={beforeInstall} />

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
			<Route path="/chat">
				<Chat />
			</Route>
			<Route path="/chat/:id" let:params>
				<Chat id={params.id} />
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
