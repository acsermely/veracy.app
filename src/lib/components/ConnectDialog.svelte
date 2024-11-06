<script lang="ts">
	import { Copy, Settings, User } from "lucide-svelte";
	import { toast } from "svelte-sonner";
	import { slide } from "svelte/transition";
	import { getDialogsState } from "../state/dialogs.svelte";
	import { getFeedState } from "../state/feed.svelte";
	import { getLocalWalletState } from "../state/local-wallet.svelte";
	import { getContentNodeState } from "../state/node.svelte";
	import { buttonVariants } from "./ui/button";
	import Button from "./ui/button/button.svelte";
	import { Dialog, DialogTrigger } from "./ui/dialog";
	import DialogContent from "./ui/dialog/dialog-content.svelte";
	import DialogFooter from "./ui/dialog/dialog-footer.svelte";
	import DialogHeader from "./ui/dialog/dialog-header.svelte";
	import DialogTitle from "./ui/dialog/dialog-title.svelte";
	import Input from "./ui/input/input.svelte";

	const feedState = getFeedState();
	const walletState = getLocalWalletState();
	const nodeState = getContentNodeState();
	const dialogsState = getDialogsState();

	$effect(() => {
		url = nodeState.url;
	});

	let url = $state("");

	let errorMessage = $state("");

	async function onRegister() {
		try {
			await walletState.register();
		} catch {
			errorMessage = "Couldn't create wallet";
			return;
		}
		onConnect();
	}

	async function onConnect() {
		try {
			await walletState.connect();
			console.log("Connect: Wallet Connected");
		} catch (e) {
			console.error(e);
			errorMessage = e as string;
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
		if (!url) {
			errorMessage = "No Server URL!";
			return;
		}
		if (!walletState.wallet) {
			onConnect();
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
					if (!walletState.wallet) {
						toast.error("No Wallet");
						throw "No wallet connected!";
					}
					return walletState.wallet.decrypt(challange);
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
			errorMessage = "Couldn't login!";
			console.error(e);
			throw errorMessage;
		}
		dialogsState.connectDialog = false;
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
				errorMessage = "Couldn't login!";
			} else {
				errorMessage = "Server Unavailable!";
			}
			console.error(e);
			throw errorMessage;
		}

		let challange: string;
		try {
			challange = await response.arrayBuffer().then((challange) => {
				if (!walletState.wallet) {
					toast.error("No Wallet");
					throw "No wallet connected!";
				}
				return walletState.wallet.decrypt(challange);
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
			errorMessage = "Couldn't login!";
			console.error(e);
			throw errorMessage;
		}
		toast.success("Logged in!");
		feedState.queryData();
	}
</script>

<Dialog bind:open={dialogsState.connectDialog}>
	{#if !walletState.address || !nodeState.isConnected}
		<DialogTrigger
			class={buttonVariants({ variant: "destructive" }) + " gap-4"}
		>
			<User />
			{#if !walletState.address}
				Register
			{:else}
				Login
			{/if}
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
			<div class="flex">
				<img
					class="h-[2rem] mr-3"
					src="/veracy-icon.svg"
					alt="app-icon"
				/>
				<div class="flex flex-col items-start">
					<DialogTitle>Connect</DialogTitle>
				</div>
			</div>
		</DialogHeader>
		<div class="flex w-full flex-col">
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

			{#if !walletState.hasKeys}
				<div
					in:slide
					out:slide
					class="flex bg-yellow-500 bg-opacity-50 items-center
					justify-center rounded-md my-2 py-3
					text-destructive-foreground w-full"
				>
					No availabel Wallet
				</div>
				<Button class="my-3" onclick={() => onRegister()}
					>Create Wallet and Register</Button
				>
			{:else if !walletState.isConnected}
				<Button class="my-3" onclick={() => onConnect()}>Connect</Button
				>
			{:else}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					in:slide
					out:slide
					class="flex bg-green-500 bg-opacity-30 items-center cursor-copy
					justify-center rounded-md my-2 py-3
					text-destructive-foreground w-full"
					onclick={() => {
						navigator.clipboard.writeText(walletState.address);
						toast.success("Wallet address Copied");
					}}
				>
					Wallet: {walletState.address.slice(0, 20)}...
					<Copy class="mx-3" />
				</div>
			{/if}

			{#if errorMessage}
				<div
					in:slide
					out:slide
					class="flex bg-destructive bg-opacity-50 items-center
					justify-center rounded-md my-2 py-3
					text-destructive-foreground w-full"
				>
					Error: {errorMessage}
				</div>
			{/if}
			{#if (walletState.isConnected && !nodeState.isConnected) || nodeState.url !== url}
				<div class="flex flex-col w-full" in:slide out:slide>
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
