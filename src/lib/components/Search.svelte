<script lang="ts">
	import { navigate } from "svelte-routing";
	import { STORAGE_SEARCH_HISTORY } from "../constants";
	import { getUserStorageState } from "../state/user-storage.svelte";
	import { Avatar, AvatarFallback } from "./ui/avatar";
	import Button from "./ui/button/button.svelte";
	import { Input } from "./ui/input";

	const userStorageState = getUserStorageState();

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

	let searchResults = $state<string[]>([]);
	let searchInput = $state("");
	let searchHistory = $state<string[]>(
		localStorage.getItem(STORAGE_SEARCH_HISTORY)?.split(" ") || [],
	);
</script>

<div class="flex-1 flex flex-col items-center w-full p-3">
	<Input
		class="my-5 w-full max-w-[450px]"
		bind:value={searchInput}
		placeholder="Search..."
		onkeyup={() => {
			searchResults = userStorageState.search(searchInput);
		}}
	/>
	<ul class="w-full max-w-[450px] h-full">
		{#if searchResults.length}
			{#each searchResults as result}
				<li class="w-full">
					{@render Item(result)}
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

{#snippet Item(id: string)}
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
			<AvatarFallback class="font-extrabold bg-transparent text-white"
				>{id.slice(0, 2)}</AvatarFallback
			>
		</Avatar>
		<p class="whitespace-nowrap overflow-hidden text-ellipsis p-3 w-full">
			{id}
		</p>
	</Button>
{/snippet}
