<script lang="ts">
	import { toast } from "svelte-sonner";
	import { getFeedState } from "../state/feed.svelte";
	import { getContentNodeState } from "../state/node.svelte";
	import { getWalletState } from "../state/wallet.svelte";
	import { buttonVariants } from "./ui/button";
	import Button from "./ui/button/button.svelte";
	import { Dialog, DialogTrigger } from "./ui/dialog";
	import DialogContent from "./ui/dialog/dialog-content.svelte";
	import DialogDescription from "./ui/dialog/dialog-description.svelte";
	import DialogFooter from "./ui/dialog/dialog-footer.svelte";
	import DialogHeader from "./ui/dialog/dialog-header.svelte";
	import DialogTitle from "./ui/dialog/dialog-title.svelte";
	import Input from "./ui/input/input.svelte";

	const feedState = getFeedState();
	const walletState = getWalletState();
	const nodeState = getContentNodeState();

	$effect(() => {
		url = nodeState.url;
	});
	let open = $state(false);
	let url = $state("");

	let errorMessage = $state("");

	async function registerKey(): Promise<void> {
		errorMessage = "";
		if (!url || !walletState.address) {
			return;
		}
		let pubKey: JsonWebKey;
		try {
			pubKey = await walletState.getPublicKey();
		} catch (e) {
			errorMessage = "Failed to get your key! Try again!";
			console.error(e);
			return;
		}

		let challange = "";
		let response: Response;
		try {
			response = await nodeState.registerKey(
				walletState.address,
				pubKey,
				url,
			);
			if (response.status !== 200) {
				throw response.status;
			}
		} catch (e) {
			if (e === 409) {
				errorMessage = "Wallet already Registered!";
			} else {
				errorMessage = "Failed to Register Wallet! Try again!";
			}
			console.error(e);
			return;
		}

		try {
			challange = await response
				.arrayBuffer()
				.then((challange) => {
					toast.info("Approve Login in your Wallet!", {
						description: "Switch to the Wallet Browser Tab",
					});
					return walletState.wallet.decrypt(
						new Uint8Array(challange),
						{
							name: "RSA-OAEP",
						},
					);
				})
				.then((buff: ArrayBufferView) => {
					const decoder = new TextDecoder();
					return decoder.decode(buff);
				})
				.finally(() => {
					feedState.queryData();
				});
		} catch (e) {
			errorMessage = "Failed to get your key! Try again!";
			console.error(e);
			return;
		}

		try {
			await nodeState.loginKeyChallange(
				walletState.address,
				challange,
				url,
			);
		} catch (e) {
			errorMessage = "Unauthorized!";
			console.error(e);
			return;
		}

		feedState.queryData();
	}

	async function loginKey(): Promise<void> {
		errorMessage = "";
		if (!url || !walletState.address) {
			return;
		}

		let response: Response;
		try {
			response = await nodeState.getKeyChallange(
				walletState.address,
				url,
			);
			if (response.status !== 200) {
				throw response.status;
			}
		} catch (e) {
			if (e === 401) {
				errorMessage = "Unauthorized!";
			} else {
				errorMessage = "Couldn't get challange!";
			}
			console.error(e);
			return;
		}

		let challange: string;
		try {
			challange = await response
				.arrayBuffer()
				.then((challange) => {
					toast.info("Approve Login in your Wallet!", {
						description: "Switch to the Wallet Browser Tab",
					});
					return walletState.wallet.decrypt(
						new Uint8Array(challange),
						{
							name: "RSA-OAEP",
						},
					);
				})
				.then((buff: ArrayBufferView) => {
					const decoder = new TextDecoder();
					return decoder.decode(buff);
				});
		} catch (e) {
			errorMessage = "Couldn't decode challange!";
			console.error(e);
			return;
		}

		try {
			response = await nodeState.loginKeyChallange(
				walletState.address,
				challange,
				url,
			);
			if (response.status !== 200) {
				throw response.status;
			}
		} catch (e) {
			errorMessage = "Unauthorized!";
			console.error(e);
			return;
		}

		feedState.queryData();
	}
</script>

{#if !walletState.isConnected || !nodeState.isConnected}
	<Dialog bind:open>
		{#if !walletState.isConnected}
			<DialogTrigger
				class={buttonVariants({ variant: "destructive" }) + " h-[10vh]"}
				>Connect</DialogTrigger
			>
		{:else}
			<DialogTrigger
				class={buttonVariants({ variant: "secondary" }) + " h-[10vh]"}
				>Connect Node</DialogTrigger
			>
		{/if}
		<DialogContent class="w-full max-w-[500px]">
			<DialogHeader>
				<DialogTitle>Connect</DialogTitle>
				<DialogDescription>
					Connect to your Wallet and Content Node
				</DialogDescription>
			</DialogHeader>
			<div class="flex w-full flex-col">
				<Button
					class="m-3 mx-6"
					disabled={walletState.isConnected}
					onclick={() => walletState.connectWeb()}
					>Connect Wallet</Button
				>
				<div>
					<h1>Node: <span class="text-green-500">Connected</span></h1>
					<Input
						class="my-3 w-full"
						placeholder="Server Address"
						type="text"
						bind:value={url}
					/>
				</div>
			</div>
			<div class="flex items-center w-full">
				<Button onclick={() => registerKey()} class="m-3 w-full"
					>Register</Button
				>
				<Button onclick={() => loginKey()} class="m-3 w-full"
					>Login</Button
				>
			</div>
			<div class="flex items-center w-full">
				<span>
					{#if errorMessage}
						Error: {errorMessage}
					{/if}
				</span>
			</div>
			<DialogFooter>
				<Button
					class="m-3"
					variant="secondary"
					onclick={() => (open = false)}>Close</Button
				>
			</DialogFooter>
		</DialogContent>
	</Dialog>
{/if}
