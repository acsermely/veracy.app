<script lang="ts">
	import { Check, Copy, Download, Loader, Trash } from "lucide-svelte";
	import { toast } from "svelte-sonner";
	import { Wallet } from "../../../models/wallet.model";
	import {
		getAppState,
		getContentNodeState,
		getFeedState,
		getWalletState,
	} from "../../../state";
	import { downloadFile } from "../../../utils/common.utils";
	import { DB } from "../../../utils/db.utils";
	import { getAddressFromKey } from "../../../utils/wallet.utils";
	import { Avatar, AvatarFallback } from "../../ui/avatar";
	import { Button } from "../../ui/button";
	import { Label } from "../../ui/label";
	import { Switch } from "../../ui/switch";
	import { Textarea } from "../../ui/textarea";

	let { quickRegister = $bindable() }: { quickRegister: boolean } = $props();

	const walletState = getWalletState();
	const nodeState = getContentNodeState();
	const appState = getAppState();
	const feedState = getFeedState();

	let createNew = $state(false);
	let createType = $state<"new" | "existing">();
	let mnemonic = $state<string>();
	let savedWallets = $state();
	let seedSaved = $state(false);
	let loading = $state(false);
	let errorMessage = $state();
	let walletList = $state<string[]>([]);

	$effect(() => {
		Wallet.newMnemonic().then((newMnemonic) => {
			mnemonic = newMnemonic;
		});
		DB.wallet.getAll().then((list) => {
			savedWallets = list.length;
		});
	});
	$effect(() => {
		if (createType === "new") {
			Wallet.newMnemonic().then((newMnemonic) => {
				mnemonic = newMnemonic;
			});
		} else {
			mnemonic = "";
		}
	});

	$effect(() => {
		if (!walletState.hasWallet && savedWallets == 0) {
			createNew = true;
		}
	});

	$effect(() => {
		getWallets();
	});

	function getWallets(): Promise<void> {
		walletList = [];
		return DB.wallet
			.getAll()
			.then((list) => {
				walletList = list;
			})
			.catch(() => {
				toast.error("Conldn't load wallets");
			});
	}

	function copyAddress(): void {
		navigator.clipboard.writeText(walletState.wallet!.address);
		toast.success("Wallet address Copied");
	}

	function downloadJsonKey(): void {
		const a = document.createElement("a");
		a.href = URL.createObjectURL(
			new Blob([JSON.stringify(walletState.wallet!.rawKey)], {
				type: "application/json",
			}),
		);
		a.setAttribute(
			"download",
			`wallet-${walletState.wallet!.address.slice(0, 3)}.json`,
		);
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}

	function triggerKeyfileOpen(): void {
		document.getElementById("keyfileInput")?.click();
	}

	function handleKeyfileOpen(event: any) {
		if (!event.target) {
			return;
		}
		const file = event.target.files[0];
		const reader = new FileReader();
		reader.onload = (e: any) => {
			try {
				const key = JSON.parse(e.target.result) as JsonWebKey;
				getAddressFromKey(key).then(() => onRegister(key));
			} catch {
				toast.error("Wallet import failed");
			}
		};
		reader.readAsText(file);
	}

	async function onRegister(key?: string | JsonWebKey) {
		loading = true;
		try {
			if (typeof key === "string" || !key) {
				await walletState.registerFromMnem(key as string | undefined);
			} else {
				await walletState.registerFromJWK(key as JsonWebKey);
			}
		} catch {
			errorMessage = "Couldn't create wallet";
			return;
		} finally {
			feedState.refreshBucketList();
			nodeState.isConnected = false;
			mnemonic = "";
			loading = false;
			toast.success("Wallet Created!");
		}
	}
</script>

<div class="flex flex-col gap-3">
	{#if createNew}
		{#if createType}
			{#if createType === "existing"}
				<input
					id="keyfileInput"
					type="file"
					accept=".json"
					class="hidden"
					onchange={handleKeyfileOpen}
				/>
				<Button variant="default" onclick={triggerKeyfileOpen}
					>Import Keyfile</Button
				>
				<div class="w-full flex justify-center">
					<p class="p-2 m-2 border-y-2">or</p>
				</div>
			{/if}
			<Textarea
				class="resize-none"
				disabled={createType === "new"}
				bind:value={mnemonic}
				placeholder="Your Seedphrase..."
				rows={2}
			></Textarea>
			{#if createType === "new"}
				<div>Save your Seedphrase:</div>
				<div class="flex w-full gap-3 items-baseline">
					<Button
						class="flex-1"
						variant="outline"
						onclick={() => {
							if (!mnemonic) {
								toast.error("Nothing to Copy");
								return;
							}
							navigator.clipboard.writeText(mnemonic);
							toast.success("Passphrase Copied");
							seedSaved = true;
						}}>Copy</Button
					>
					or
					<Button
						class="flex-1"
						variant="outline"
						onclick={() => {
							if (!mnemonic) {
								toast.error("Nothing to Download");
								return;
							}
							const fileName = `seedphrase_${mnemonic.slice(0, 3).trim()}.txt`;
							downloadFile(fileName, mnemonic, "text/plain");
							seedSaved = true;
						}}>Download</Button
					>
				</div>
			{/if}
			<div class="flex items-center">
				<Label for="auto-register" class="mr-3">Quick Register:</Label>
				<Switch id="auto-register" bind:checked={quickRegister} />
			</div>
			<Button
				disabled={loading ||
					!mnemonic ||
					(createType === "new" && !seedSaved)}
				variant="default"
				onclick={() => onRegister(mnemonic)}
			>
				{#if loading}
					<Loader class="animate-spin m-2" />
				{:else if !seedSaved && createType === "new"}
					Save your Seedphrase!
				{:else}
					Register
				{/if}
			</Button>
			<div class="text-xs">
				By creating an account you agree to the
				<a
					target="_blank"
					class="text-blue-600 hover:underline"
					href="/terms-of-use"
				>
					Terms of Use
				</a>
				and
				<a
					target="_blank"
					class="text-blue-600 hover:underline"
					href="/privacy-policy"
				>
					Privacy Policy
				</a>.
			</div>
		{:else}
			<div class="flex flex-col h-full gap-5 mb-10 items-center">
				{#if !walletState.wallet}
					<h1 class="text-2xl">Wellcome to Veracy!</h1>
					{#if appState.installPrompt}
						<Button
							class="standalone:hidden ml-2 hover:bg-opacity-30"
							onclick={() => {
								console.log(appState.installPrompt);
								if (!appState.installPrompt) {
									return;
								}
								appState.installPrompt
									.prompt()
									.then((result: any) => {
										console.log(
											`Install prompt was: ${result.outcome}`,
										);
									})
									.catch((e: any) => {
										toast.error("Install Failed!");
										console.error(e);
									});
							}}
						>
							Install Veracy
						</Button>
					{/if}
					<h3 class="text-sm">Setup your Profile</h3>
				{:else}
					<h3 class="text-xl">Add Profile</h3>
				{/if}
				<Button
					class="ml-2 hover:bg-opacity-30"
					onclick={() => {
						createType = "new";
						quickRegister = true;
					}}
				>
					New
				</Button>
				<Button
					class="ml-2 hover:bg-opacity-30"
					variant="secondary"
					onclick={() => {
						createType = "existing";
						quickRegister = true;
					}}
				>
					Existing
				</Button>
			</div>
		{/if}
	{:else}
		{#if walletState.wallet?.address}
			<div class="flex w-full flex-col gap-0">
				<div
					class="flex bg-green-500 border-green-500 bg-opacity-30 border-2 items-center
						justify-evenly rounded-md my-1 px-5 h-12
						text-primary w-full transition"
				>
					{walletState.wallet?.address.slice(0, 10)}...
					<Button
						class="ml-2 hover:bg-opacity-30 cursor-copy"
						variant="ghost"
						size="icon"
						onclick={copyAddress}
					>
						<Copy onclick={copyAddress} />
					</Button>
					<Button
						variant="ghost"
						class="hover:bg-opacity-30 cursor-pointer"
						size="icon"
						onclick={downloadJsonKey}
					>
						<Download onclick={downloadJsonKey} />
					</Button>
				</div>
				<Button
					variant="ghost"
					class="text-xs p-0"
					onclick={() => {
						walletState.disconnectWallet();
						nodeState.logout();
					}}>Disconnect</Button
				>
			</div>
		{/if}
		<div>Wallets:</div>
		<div class="flex flex-col gap-2 max-h-[50vh] overflow-scroll">
			<Button
				variant="secondary"
				class="text-xl"
				onclick={() => {
					createNew = true;
					quickRegister = true;
				}}>+</Button
			>
			{#if !walletList.length}
				<div>loading wallets</div>
			{:else}
				{#each walletList as wallet}
					<div class="flex w-full items-center">
						<Button
							variant="outline"
							class="h-fit flex-1"
							disabled={wallet === walletState.wallet?.address}
							onclick={() => {
								quickRegister = false;
								nodeState.isConnected = false;
								walletState.useWallet(wallet);
							}}
						>
							<Avatar
								class="mr-3 bg-gradient-to-bl from-amber-500 via-blue-500 to-teal-500"
							>
								<AvatarFallback
									class="font-extrabold bg-transparent text-white"
									>{wallet.slice(0, 2)}</AvatarFallback
								>
							</Avatar>
							{wallet.slice(0, 15)}...
							{#if wallet === walletState.wallet?.address}
								<Check class="text-green-500" />
							{:else}
								<Button
									variant="ghost"
									class="h-full hover:bg-destructive hover:bg-opacity-50"
									onclick={(e: Event) => {
										e.stopPropagation();
										walletState
											.removeWallet(wallet)
											.then(getWallets);
									}}
								>
									<Trash />
								</Button>
							{/if}
						</Button>
					</div>
				{/each}
			{/if}
		</div>
	{/if}
</div>
