<script lang="ts">
	import { Minus, Plus } from "lucide-svelte";
	import { Button } from "../ui/button";
	import { Input } from "../ui/input";

	let {
		tags = $bindable(),
		title = $bindable(),
		price = $bindable(),
		needPrice,
	}: {
		tags: string[];
		title?: string;
		price?: number;
		needPrice?: boolean;
	} = $props();

	function addTag(): void {
		if (tags.length > 0 && tags.length > 4) {
			return;
		}
		tags.push("");
	}
	function removeTag(): void {
		if (tags.length < 1) {
			return;
		}
		tags = tags.slice(0, tags.length - 1);
	}
</script>

<div class="max-w-[450px] w-full m-5 flex flex-col">
	<div class="flex items-baseline justify-between">
		<span class="text-lg p-3">Title: </span>
		<Input
			maxlength={40}
			class="w-9/12 mr-2"
			bind:value={title}
			placeholder="Post Title..."
		/>
	</div>
	<div class="flex items-baseline justify-between">
		<span class="text-lg p-3" class:text-secondary={!needPrice}
			>Price:
		</span>
		<Input
			maxlength={10}
			bind:value={price}
			class={(needPrice && !price ? "border-destructive " : "") +
				"w-9/12 mr-2"}
			disabled={!needPrice}
			type="number"
			placeholder="Private Content Price..."
		/>
	</div>
	{#if needPrice}
		<p class="w-full pr-3 text-end text-muted-foreground text-sm">
			*You need to send this amount ot the Platform as Activation Fee!
		</p>
	{/if}
	<div class="flex flex-col">
		<p class="text-lg p-3">Tags:</p>
		{#each tags as _, i}
			<div class="mb-3 mx-5">
				<Input
					maxlength={30}
					class="w-full"
					placeholder="Search Tag..."
					bind:value={tags[i]}
				/>
			</div>
		{/each}
		<div>
			<Button variant="ghost" size="icon" onclick={() => addTag()}
				><Plus /></Button
			>
			<Button variant="ghost" size="icon" onclick={() => removeTag()}
				><Minus /></Button
			>
		</div>
	</div>
</div>
