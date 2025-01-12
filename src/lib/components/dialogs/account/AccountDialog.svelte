<script lang="ts">
	import { ChevronLeft, Copy, Moon, Settings, Sun } from "lucide-svelte";
	import { toggleMode } from "mode-watcher";
	import { toast } from "svelte-sonner";
	import {
		getContentNodeState,
		getDialogsState,
		getWalletState,
	} from "../../../state";
	import { Button, buttonVariants } from "../../ui/button";
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogTrigger,
	} from "../../ui/dialog";
	import AccountServer from "./AccountServer.svelte";
	import AccountWallet from "./AccountWallet.svelte";

	const dialogsState = getDialogsState();
	const walletState = getWalletState();
	const nodeState = getContentNodeState();

	$effect(() => {
		if (!walletState.wallet) {
			currentView = "Wallets";
			quickRegister = true;
		} else if (!nodeState.isConnected) {
			currentView = "Server";
		} else {
			currentView = undefined;
		}
	});

	let currentView = $state<"Wallets" | "Server">();
	let quickRegister = $state(false);

	function copyAddress(): void {
		navigator.clipboard.writeText(walletState.wallet!.address);
		toast.success("Wallet address Copied");
	}
</script>

<Dialog
	bind:open={dialogsState.connectDialog}
	openFocus={"#connect-dialog-content"}
>
	<DialogTrigger
		class={buttonVariants({ variant: "ghost" }) + " gap-4 hidden md:flex"}
	>
		<Settings />
	</DialogTrigger>
	<DialogContent
		id="connect-dialog-content"
		class="w-full max-w-[450px] min-h-[200px]"
	>
		<DialogHeader>
			<div class="flex items-center">
				{#if !currentView}
					<img
						class="h-[2rem] mr-3"
						src="/veracy-icon.svg"
						alt="app-icon"
					/>
				{:else}
					<Button
						size="icon"
						variant="ghost"
						class="mr-3"
						onclick={() => {
							currentView = undefined;
						}}
						><ChevronLeft
							onclick={() => {
								currentView = undefined;
							}}
						/></Button
					>
				{/if}
				<div class="flex flex-col items-start">
					<DialogTitle>{currentView || "Settings"}</DialogTitle>
				</div>
			</div>
		</DialogHeader>
		{#if currentView === "Wallets"}
			<AccountWallet bind:quickRegister />
		{:else if currentView === "Server"}
			<AccountServer bind:quickRegister />
		{:else}
			<div class="flex flex-col gap-3 flex-1">
				<div
					class="flex bg-opacity-30 border-2 items-center
									justify-between rounded-md my-1 px-5
									text-primary w-full"
					class:bg-green-500={walletState.wallet?.address}
					class:border-green-500={walletState.wallet?.address}
					class:bg-yellow-500={!walletState.wallet?.address}
					class:border-yellow-500={!walletState.wallet?.address}
				>
					{#if walletState.wallet?.address}
						Wallet: {walletState.wallet!.address.slice(0, 15)}...
						<Button
							class="ml-2 hover:bg-opacity-30 cursor-copy"
							variant="ghost"
							onclick={copyAddress}
						>
							<Copy onclick={copyAddress} />
						</Button>
						<Button
							class="ml-2 hover:bg-opacity-30"
							variant="ghost"
							onclick={() => {
								currentView = "Wallets";
							}}
						>
							<Settings
								onclick={() => {
									currentView = "Wallets";
								}}
							/>
						</Button>
					{:else}
						<div class="w-full text-center">
							<Button
								variant="ghost"
								class="w-fit hover:bg-opacity-30"
								onclick={() => {
									currentView = "Wallets";
								}}>Setup Wallet</Button
							>
						</div>
					{/if}
				</div>
				<div
					class="flex bg-opacity-30 border-2 items-center
									justify-between rounded-md my-1 px-5
									text-primary w-full"
					class:bg-green-500={nodeState.isConnected}
					class:border-green-500={nodeState.isConnected}
					class:bg-yellow-500={!nodeState.isConnected}
					class:border-yellow-500={!nodeState.isConnected}
				>
					{#if nodeState.isConnected}
						Server: {nodeState.url.slice(0, 25)}
						<Button
							class="ml-2 hover:bg-opacity-30"
							variant="ghost"
							onclick={() => {
								currentView = "Server";
							}}
						>
							<Settings
								onclick={() => {
									currentView = "Server";
								}}
							/>
						</Button>
					{:else}
						<div class="w-full text-center">
							<Button
								variant="ghost"
								class="w-fit hover:bg-opacity-30"
								onclick={() => {
									currentView = "Server";
								}}>Register Server</Button
							>
						</div>
					{/if}
				</div>
				<div>Theme:</div>
				<Button onclick={toggleMode} variant="ghost">
					<Sun onclick={toggleMode} class="block dark:hidden" />
					<Moon onclick={toggleMode} class="hidden dark:block" />
				</Button>
			</div>
		{/if}
	</DialogContent>
</Dialog>
