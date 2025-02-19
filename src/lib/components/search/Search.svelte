<script lang="ts">
	import { navigate } from "svelte-routing";
	import { STORAGE_SEARCH_HISTORY } from "../../constants";
	import type { ProfileData } from "../../models/user.model";
	import {
		getSearchState,
		type SearchResult,
	} from "../../state/search.svelte";
	import { ArweaveUtils } from "../../utils/arweave.utils";
	import { Avatar, AvatarFallback } from "../ui/avatar";
	import AvatarImage from "../ui/avatar/avatar-image.svelte";
	import Button from "../ui/button/button.svelte";
	import { Input } from "../ui/input";

	const searchState = getSearchState();

	function addToHistory(id: string): void {
		if (searchHistory.includes(id)) {
			return;
		}
		searchHistory.unshift(id);
		localStorage.setItem(
			STORAGE_SEARCH_HISTORY,
			searchHistory.filter((item) => item).join(" "),
		);
	}

	let searchResults = $state<SearchResult[]>([]);
	let searchInput = $state("");
	let searchHistory = $state<string[]>(
		localStorage.getItem(STORAGE_SEARCH_HISTORY)?.split(" ") || [],
	);

	async function getProfile(
		address: string,
	): Promise<ProfileData | undefined> {
		return ArweaveUtils.getLatestProfile(address);
	}
</script>

<div class="flex-1 flex flex-col items-center w-full p-3">
	<Input
		class="my-5 w-full max-w-[450px]"
		bind:value={searchInput}
		placeholder="Search..."
		onkeyup={() => {
			searchResults = searchState.search(searchInput);
		}}
	/>
	<ul class="w-full max-w-[450px] h-full">
		{#if searchResults.length}
			{#each searchResults as result}
				<li class="w-full">
					{@render Item(result.address, result.username)}
				</li>
			{/each}
		{:else if searchHistory.length}
			<li class="w-full m-2 opacity-50 text-primary">History:</li>
			{#each searchHistory as item}
				<li class="w-full">
					{@render Item(item)}
				</li>
			{/each}
		{:else}
			<li class="flex w-full m-2 opacity-50 justify-center">
				No history
			</li>
		{/if}
	</ul>
</div>

{#snippet Item(id: string, username?: string)}
	<Button
		variant="outline"
		class="w-full max-w-[450px] my-2 p-2 h-auto"
		onclick={() => {
			addToHistory(id);
			navigate("/p/" + id);
		}}
	>
		<Avatar
			class="inline-flex bg-gradient-to-bl from-amber-500 via-blue-500 to-teal-500 bg-opacity-50"
		>
			{#await getProfile(id)}
				<AvatarFallback
					class="font-extrabold bg-transparent text-white"
				>
					{id.slice(0, 2)}
				</AvatarFallback>
			{:then profile}
				{#if profile?.img}
					<AvatarImage src={profile.img} />
				{:else}
					<AvatarFallback
						class="font-extrabold bg-transparent text-white"
					>
						{id.slice(0, 2)}
					</AvatarFallback>
				{/if}
			{/await}
		</Avatar>
		<div class="flex flex-col items-start p-3 w-full overflow-hidden">
			{#if username}
				<span
					class="whitespace-nowrap overflow-hidden text-ellipsis w-full text-start"
				>
					{username}
				</span>
				<span
					class="text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis w-full text-start"
				>
					{id}
				</span>
			{:else}
				<span
					class="whitespace-nowrap overflow-hidden text-ellipsis w-full text-start"
				>
					{id}
				</span>
			{/if}
		</div>
	</Button>
{/snippet}
