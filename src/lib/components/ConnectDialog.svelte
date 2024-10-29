<script lang="ts">
	import { Server, Settings } from "lucide-svelte";
	import { toast } from "svelte-sonner";
	import { getDialogsState } from "../state/dialogs.svelte";
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
	import { Label } from "./ui/label";
	import { Switch } from "./ui/switch";

	const feedState = getFeedState();
	const walletState = getWalletState();
	const nodeState = getContentNodeState();
	const dialogsState = getDialogsState();

	$effect(() => {
		url = nodeState.url;
	});

	let url = $state("");

	let errorMessage = $state("");

	async function onConnect() {
		try {
			await walletState.connectWeb();
			console.log("Connect: Wallet Connected");
		} catch {
			errorMessage = "Couldn't connect wallet";
			return;
		}
		try {
			await nodeState.loginCheck();
			console.log("Connect: Login check");
			dialogsState.connectDialog = false;
			return;
		} catch {
			console.info("Connect: Not logged in!");
		}

		try {
			await loginKey();
			console.log("Connect: Login key");
			dialogsState.connectDialog = false;
			return;
		} catch {
			console.info("Connect: Need registration!");
		}

		try {
			await registerKey();
			console.log("Connect: Register key");
			dialogsState.connectDialog = false;
			return;
		} catch {
			console.info("Connect: Registration failed!");
		}
	}

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
			throw errorMessage;
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
			throw errorMessage;
		}
		try {
			challange = await response
				.arrayBuffer()
				.then((challange) => {
					toast.warning("Approve Login in your Wallet!", {
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
			throw errorMessage;
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
			throw errorMessage;
		}

		feedState.queryData();
	}

	async function loginKey(): Promise<void> {
		errorMessage = "";
		if (!url || !walletState.address) {
			throw "No URL or Wallet Address";
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
				errorMessage = "Server Unavailable!";
			}
			console.error(e);
			throw errorMessage;
		}

		let challange: string;
		try {
			challange = await response
				.arrayBuffer()
				.then((challange) => {
					toast.warning("Approve Login in your Wallet!", {
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
			throw errorMessage;
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
			throw errorMessage;
		}
		toast.success("Logged in!");
		feedState.queryData();
	}
</script>

<Dialog bind:open={dialogsState.connectDialog}>
	{#if !walletState.isConnected || !nodeState.isConnected}
		<DialogTrigger
			class={buttonVariants({ variant: "destructive" }) + " gap-4"}
		>
			<Server />
			Login
		</DialogTrigger>
	{:else}
		<DialogTrigger
			class={buttonVariants({ variant: "ghost" }) +
				" gap-4 hidden md:flex"}
		>
			<Settings />
		</DialogTrigger>
	{/if}
	<DialogContent class="w-full max-w-[500px]">
		<DialogHeader>
			<DialogTitle>Connect</DialogTitle>
			<DialogDescription>
				Your Wallet will open in a different tab!
			</DialogDescription>
		</DialogHeader>
		<div class="flex w-full flex-col">
			<div class="flex items-center gap-4">
				<Label for="auto-login-switch">Auto Login:</Label>
				<Switch
					id="auto-login-switch"
					bind:checked={walletState.autoLogin}
				/>
			</div>
			<Button
				class="my-3"
				disabled={walletState.isConnected}
				onclick={() => onConnect()}>Connect</Button
			>
			{#if !walletState.address}
				<Button
					class="my-3"
					disabled={walletState.isConnected}
					onclick={() => onConnect()}>Create New Wallet</Button
				>
			{/if}
			<div>
				<h1>
					Server<span class:hidden={!nodeState.isConnected}
						>: <span class="text-green-500">connected</span></span
					>
				</h1>
				<Input
					class="my-3 w-full"
					placeholder="Server Address"
					type="text"
					bind:value={url}
				/>
			</div>
			{#if errorMessage}
				<div
					class="flex bg-destructive bg-opacity-50 items-center justify-center rounded-md my-2 py-3 text-destructive-foreground w-full"
				>
					Error: {errorMessage}
				</div>
			{/if}
			{#if (walletState.isConnected && !nodeState.isConnected) || nodeState.url !== url}
				<div class="flex items-center w-full">
					<Button onclick={() => loginKey()} class="m-3 w-full"
						>Login</Button
					>
				</div>
				<div class="flex items-center w-full my-3 mt-6">
					Would you like to Register:
				</div>
				<div class="flex items-center w-full">
					<Button onclick={() => registerKey()} class="m-3 w-full"
						>One-Click Registration</Button
					>
				</div>
			{/if}
		</div>
		<DialogFooter>
			<Button
				class="m-3"
				variant="secondary"
				onclick={() => (dialogsState.connectDialog = false)}
				>Close</Button
			>
		</DialogFooter>
	</DialogContent>
</Dialog>
