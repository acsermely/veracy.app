<script lang="ts">
	import { ModeWatcher } from "mode-watcher";
	import { Route, Router } from "svelte-routing";
	import ActionBar from "./lib/components/ActionBar.svelte";
	import Main from "./lib/components/Main.svelte";
	import Profile from "./lib/components/Profile.svelte";
	import { setWalletState } from "./lib/state/wallet.svelte";

	import { Moon, Sun } from "lucide-svelte";
	import { toggleMode } from "mode-watcher";
	import ConnectDialog from "./lib/components/ConnectDialog.svelte";
	import Create from "./lib/components/Create.svelte";
	import Button from "./lib/components/ui/button/button.svelte";
	import { Toaster } from "./lib/components/ui/sonner";
	import { setDialogsState } from "./lib/state/dialogs.svelte";
	import { setFeedState } from "./lib/state/feed.svelte";
	import { setContentNodeState } from "./lib/state/node.svelte";
	setFeedState();
	setWalletState();
	setDialogsState();
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
		<div class="flex flex-col w-full gap-2">
			<ConnectDialog />
			<Button
				class="hidden md:flex w-full"
				onclick={toggleMode}
				variant="ghost"
				size="icon"
			>
				<Sun class="block dark:hidden" />
				<Moon class="hidden dark:block" />
				<span class="sr-only">Theme</span>
			</Button>
		</div>
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
<Toaster richColors expand={true} position="top-center" />
