<script lang="ts">
	import type { Snippet } from "svelte";
	import { fade, slide } from "svelte/transition";

	const {
		onRefresh,
		resistance = 0.5,
		children,
	}: {
		onRefresh: () => void;
		resistance?: number;
		children: Snippet;
	} = $props();

	let startY = $state(0);
	let currentY = $state(0);
	let pulling = $state(false);
	let shouldRefresh = $state(false);
	let translateY = $state(0);

	const touchStart = (event: TouchEvent) => {
		startY = event.touches[0].clientY;
	};

	const touchMove = (event: TouchEvent) => {
		currentY = event.touches[0].clientY;

		if (currentY - startY > 5) {
			pulling = true;
			translateY = (currentY - startY) * resistance;
			if ((currentY - startY) * 1 > 150) {
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
		}, 300);
	};
</script>

<div
	ontouchstart={touchStart}
	ontouchmove={touchMove}
	ontouchend={touchEnd}
	class="flex-1 flex flex-col items-center w-full"
>
	<div
		transition:slide
		class="text-accent animate-bounce transition-all mt-5"
		class:hidden={!pulling}
		class:text-primary={shouldRefresh}
	>
		Refresh
	</div>
	<div
		transition:fade
		class="flex-1 flex flex-col items-center w-full transition-transform"
		style="transform: translateY({translateY}px)"
	>
		{@render children()}
	</div>
</div>
