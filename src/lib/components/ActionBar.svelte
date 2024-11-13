<script>
	import { Home, Moon, PlusCircle, Sun, User } from "lucide-svelte";
	import { toggleMode } from "mode-watcher";
	import { link } from "svelte-routing";
	import { getLocalWalletState } from "../state/local-wallet.svelte";
	import BuyPostDialog from "./BuyPostDialog.svelte";
	import ConnectDialog from "./ConnectDialog.svelte";
	import { Button } from "./ui/button";

	const walletState = getLocalWalletState();
</script>

<div
	class="w-full flex justify-evenly py-3 md:max-w-[200px] md:justify-start md:flex-col"
>
	<h1
		class="hidden md:block text-2xl p-5 w-full text-center cursor-default bg-gradient-to-r from-amber-500 via-blue-500 to-teal-500 text-transparent bg-clip-text font-extrabold"
	>
		Veracy<span class="text-xs">.app</span>
	</h1>
	<a
		href="/"
		use:link
		class="flex md:gap-4 md:p-5"
		onclick={() => {
			const elem = document.getElementById("top");
			elem?.scrollIntoView({
				behavior: "smooth",
			});
			console.log(elem);
		}}
	>
		<Home size="30" />
		<span class="hidden md:block">Home</span>
	</a>
	<a href="/create" use:link class="flex md:gap-4 md:p-5">
		<PlusCircle size="30" />
		<span class="hidden md:block">New</span>
	</a>
	{#if walletState.address}
		<a
			href={"/p/" + walletState.address}
			use:link
			class="flex md:gap-4 md:p-5"
		>
			<User size="30" />
			<span class="hidden md:block">Profile</span>
		</a>
	{/if}
</div>
<div class="flex flex-col w-full gap-2">
	<ConnectDialog />
	<BuyPostDialog />
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
