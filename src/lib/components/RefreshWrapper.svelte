<script lang="ts">
	import type { Snippet } from "svelte";
	import { slide } from "svelte/transition";

	const {
		onRefresh,
		resistance = 0.3,
		children,
	}: {
		onRefresh: () => void;
		resistance?: number;
		children: Snippet;
	} = $props();

	let startY = 0;
	let currentY = 0;
	let pulling = $state(false);
	let shouldRefresh = $state(false);
	let translateY = $state(0);

	const touchStart = (event: TouchEvent) => {
		startY = event.touches[0].clientY;
	};

	const touchMove = (event: TouchEvent) => {
		currentY = event.touches[0].clientY;

		if (currentY - startY > 20) {
			pulling = true;
			translateY = (currentY - startY) * resistance;
			if (currentY - startY > 180) {
				shouldRefresh = true;
			} else {
				shouldRefresh = false;
			}
		} else {
			pulling = false;
		}
	};

	const touchEnd = () => {
		if (shouldRefresh) {
			refresh();
			translateY = 60;
		} else {
			translateY = 0;
			pulling = false;
			shouldRefresh = false;
		}
	};

	const refresh = async () => {
		await onRefresh();
		setTimeout(() => {
			translateY = 0;
			pulling = false;
			shouldRefresh = false;
		}, 0);
	};
</script>

<div
	ontouchstart={touchStart}
	ontouchmove={touchMove}
	ontouchend={touchEnd}
	class="flex-1 flex flex-col items-center w-full"
>
	{#if pulling}
		<div
			in:slide
			out:slide
			class="text-primary animate-bounce mt-5 transition-colors"
			class:text-accent={!shouldRefresh}
		>
			Refresh
		</div>
	{/if}
	<div
		in:slide
		class="content-wrapper"
		style="transform: translateY({translateY}px)"
	>
		{@render children()}
	</div>
</div>

<style>
	.content-wrapper {
		transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
	}
</style>
