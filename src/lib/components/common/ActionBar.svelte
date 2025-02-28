<script lang="ts">
	import {
		Home,
		MessageSquare,
		PlusCircle,
		Search,
		User,
	} from "lucide-svelte";
	import { link } from "svelte-routing";
	import { getFeedState } from "../../state";
	import { getWalletState } from "../../state/wallet.svelte";
	import AccountDialog from "../dialogs/account/AccountDialog.svelte";
	import BucketDialog from "../dialogs/bucket/BucketDialog.svelte";
	import FeedbackDialog from "../dialogs/feedback/FeedbackDialog.svelte";
	import BuyPostDialog from "../dialogs/payments/BuyPostDialog.svelte";
	import SetPaymentDialog from "../dialogs/payments/SetPaymentDialog.svelte";
	import ProfileDialog from "../dialogs/profile/ProfileDialog.svelte";
	import ShareSheet from "../dialogs/share/ShareSheet.svelte";

	const walletState = getWalletState();
	const feedState = getFeedState();
</script>

<div
	class="w-full flex justify-evenly py-2 md:max-w-[200px] md:justify-start md:flex-col"
>
	<a
		class="hidden md:block text-2xl p-5 w-full text-center select-none bg-gradient-to-r from-amber-500 via-blue-500 to-teal-500 text-transparent bg-clip-text font-extrabold"
		href="/"
		use:link
		onclick={() => {
			feedState.scrollPosition = 0;
			const elem = document.getElementById("top");
			elem?.scrollIntoView({
				behavior: "smooth",
			});
		}}
	>
		Veracy<span class="text-xs">.app</span>
	</a>
	<a
		href="/"
		use:link
		class="flex md:gap-4 md:p-5"
		onclick={() => {
			const elem = document.getElementById("top");
			elem?.scrollIntoView({
				behavior: "smooth",
			});
			feedState.queryData();
		}}
	>
		<Home size="28" />
		<span class="hidden md:block">Home</span>
	</a>
	{#if walletState.wallet?.address}
		<a
			href={"/p/" + walletState.wallet.address}
			use:link
			class="flex md:gap-4 md:p-5"
		>
			<User size="28" />
			<span class="hidden md:block">Profile</span>
		</a>
	{/if}
	<a href="/create" use:link class="flex md:gap-4 md:p-5">
		<PlusCircle size="28" />
		<span class="hidden md:block">New</span>
	</a>
	<a href="/search" use:link class="flex md:gap-4 md:p-5">
		<Search size="28" />
		<span class="hidden md:block">Search</span>
	</a>
	{#if walletState.wallet?.address}
		<a href="/chat" use:link class="flex md:gap-4 md:p-5">
			<MessageSquare size="28" />
			<span class="hidden md:block">Chat</span>
		</a>
	{/if}
</div>
<div class="flex flex-col w-full gap-2">
	<BucketDialog />
	<AccountDialog />
	<BuyPostDialog />
	<FeedbackDialog />
	<SetPaymentDialog />
	<ShareSheet />
	<ProfileDialog />
</div>
