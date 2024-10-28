<script>
	import { Home, PlusCircle, User } from "lucide-svelte";
	import { link } from "svelte-routing";
	import { getWalletState } from "../state/wallet.svelte";

	const walletState = getWalletState();
</script>

<div
	class="w-full flex justify-evenly p-2 md:max-w-[200px] md:justify-start md:flex-col"
>
	<h1 class="hidden md:block text-2xl p-5 w-full text-center cursor-default">
		Veracy<span class="text-xs">.app</span>
	</h1>
	<a href="/" use:link class="flex md:gap-4 md:p-5">
		<Home />
		<span class="hidden md:block">Home</span>
	</a>
	<a href="/create" use:link class="flex md:gap-4 md:p-5">
		<PlusCircle />
		<span class="hidden md:block">New</span>
	</a>
	{#if walletState.address}
		<a
			href={"/p/" + walletState.address}
			use:link
			class="flex md:gap-4 md:p-5"
		>
			<User />
			<span class="hidden md:block">Profile</span>
		</a>
	{:else}
		<a class="flex md:gap-4 md:p-5">
			<User />
			<span class="hidden md:block">Profile</span>
		</a>
	{/if}
</div>
