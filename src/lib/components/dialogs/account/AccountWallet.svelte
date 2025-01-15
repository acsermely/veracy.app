<script lang="ts">
	import { Copy, Download, Loader } from "lucide-svelte";
	import { toast } from "svelte-sonner";
	import { Wallet } from "../../../models/wallet.model";
	import { getContentNodeState, getWalletState } from "../../../state";
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

	let createNew = $state(false);
	let createType = $state<"new" | "existing">();
	let mnemonic = $state<string>();
	let savedWallets = $state();
	let seedSaved = $state(false);
	let loading = $state(false);
	let errorMessage = $state();
	$effect(() => {
		Wallet.newMnemonic().then((newMnemonic) => {
			mnemonic = newMnemonic;
		});
		DB.getAllWalletKey().then((list) => {
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
			<Textarea
				class="resize-none"
				disabled={createType === "new"}
				bind:value={mnemonic}
				placeholder="Your Seedphrase..."
				rows={2}
			></Textarea>
			{#if createType === "new"}
				<div>Save your Seedphrase:</div>
				<div class="flex w-full gap-3">
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
						}}>Copy Seedphrase</Button
					>
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
						}}>Download Seedphrase</Button
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
				{:else if !seedSaved}
					Save your Seedphrase!
				{:else}
					Register
				{/if}
			</Button>
			{#if createType === "existing"}
				<div class="w-full flex justify-center">
					<p class="p-2 m-2 border-y-2">or</p>
				</div>
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
			{/if}
		{:else}
			<div class="flex flex-col h-full gap-5 mb-10 items-center">
				{#if !walletState.wallet}
					<h1 class="text-2xl">Wellcome to Veracy!</h1>
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
			<div
				class="flex bg-green-500 border-green-500 bg-opacity-30 border-2 items-center
						justify-center rounded-md my-1 px-5 h-12
						text-primary w-full transition"
			>
				{walletState.wallet?.address.slice(0, 15)}...
				<Button
					class="ml-2 hover:bg-opacity-30 cursor-copy"
					variant="ghost"
					onclick={copyAddress}
				>
					<Copy onclick={copyAddress} />
				</Button>
				<Button
					variant="ghost"
					class="hover:bg-opacity-30 cursor-pointer"
					onclick={downloadJsonKey}
				>
					<Download onclick={downloadJsonKey} />
				</Button>
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
			{#await DB.getAllWalletKey()}
				<div>loading wallets</div>
			{:then walletList}
				{#each walletList as wallet}
					<Button
						variant="outline"
						class="h-fit"
						onclick={() => {
							quickRegister = false;
							nodeState.isConnected = false;
							walletState.useWallet(wallet);
						}}
					>
						<Avatar class="mr-3">
							<AvatarFallback>{wallet.slice(0, 2)}</AvatarFallback
							>
						</Avatar>
						{wallet.slice(0, 20)}...
					</Button>
				{/each}
			{:catch}
				<div>Failed to load wallets</div>
			{/await}
		</div>
	{/if}
</div>
