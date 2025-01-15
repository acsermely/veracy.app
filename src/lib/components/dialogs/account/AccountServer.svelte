<script lang="ts">
	import { toast } from "svelte-sonner";
	import type { Wallet } from "../../../models/wallet.model";
	import {
		getContentNodeState,
		getDialogsState,
		getFeedState,
		getWalletState,
	} from "../../../state";
	import { Button } from "../../ui/button";
	import { Input } from "../../ui/input";

	let { quickRegister = $bindable() }: { quickRegister: boolean } = $props();

	const walletState = getWalletState();
	const nodeState = getContentNodeState();
	const feedState = getFeedState();
	const dialogsState = getDialogsState();

	$effect(() => {
		url = nodeState.url;
	});

	$effect(() => {
		if (!loading && walletState.wallet && !nodeState.isConnected) {
			if (quickRegister) {
				quickRegister = false;
				onRegister(url).then(() => {
					if (nodeState.isConnected)
						dialogsState.connectDialog = false;
				});
			} else if (!regNeeded) {
				onLogin(walletState.wallet).then(() => {
					if (nodeState.isConnected)
						dialogsState.connectDialog = false;
				});
			}
		}
	});

	let url = $state("");
	let regNeeded = $state(false);
	let loading = false;

	async function onLogin(wallet: Wallet): Promise<void> {
		if (!wallet) {
			throw "No Wallet";
		}
		loading = true;
		return nodeState
			.getKeyChallange(wallet.address, url)
			.then((response) => response.arrayBuffer())
			.then((encryptedChal) => wallet.decrypt(encryptedChal))
			.then((challange) =>
				nodeState.loginKeyChallange(wallet.address, challange, url),
			)
			.then(() => {
				toast.success("Logged In");
			})
			.catch(() => {
				regNeeded = true;
				toast.error("Couldn't login! Try Register!");
			})
			.finally(() => {
				loading = false;
				feedState.queryData();
			});
	}

	async function onRegister(url: string): Promise<void> {
		if (!walletState.wallet) {
			throw "No Wallet";
		}
		loading = true;
		return nodeState
			.registerKey(
				walletState.wallet.address,
				await walletState.getPublicKey(),
				url,
			)
			.then((response) => response.arrayBuffer())
			.then((encryptedChal) => walletState.wallet!.decrypt(encryptedChal))
			.then((challange) =>
				nodeState.loginKeyChallange(
					walletState.wallet!.address,
					challange,
					url,
				),
			)
			.then(() => {
				regNeeded = false;
				toast.success("Registered");
			})
			.catch(() => {
				toast.error("Couldn't register! Try Login!");
				regNeeded = false;
				throw "couldn't register";
			})
			.finally(() => {
				loading = false;
				feedState.queryData();
			});
	}
</script>

<div class="flex flex-col gap-3">
	{#if !walletState.wallet?.address}
		<div
			class="flex bg-red-500 border-red-500 bg-opacity-30 border-2 items-center
					justify-center rounded-md my-1 px-5 h-8
					text-primary w-full transition"
		>
			Create a Wallet first!
		</div>
	{:else}
		<div
			class="flex bg-green-500 border-green-500 bg-opacity-30 border-2 items-center
						justify-center rounded-md my-1 px-5 h-8
						text-primary w-full transition"
		>
			Wallet: {walletState.wallet?.address.slice(0, 20)}...
		</div>
		<Input
			class="w-full text-lg"
			placeholder="Server Address"
			type="text"
			bind:value={url}
		/>
		<div class="flex w-full gap-3">
			{#if regNeeded || url !== nodeState.url}
				<Button
					class="flex-1 w-full"
					onclick={() => {
						onRegister(url).finally(() => {
							if (!nodeState.isConnected) {
								onLogin(walletState.wallet!);
							}
						});
					}}>Register</Button
				>
			{:else}
				<Button
					disabled={!walletState.wallet}
					class="flex-1 w-full"
					onclick={() => onLogin(walletState.wallet!)}>Login</Button
				>
			{/if}
		</div>
	{/if}
</div>
