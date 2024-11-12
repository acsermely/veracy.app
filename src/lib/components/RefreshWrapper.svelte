<script lang="ts">
	import type { Snippet } from "svelte";
	import { fade } from "svelte/transition";

	const {
		onRefresh,
		resistance = 0.1,
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
	let atTop = $state(true);

	const touchStart = (event: TouchEvent) => {
		startY = event.touches[0].clientY;
	};

	const touchMove = (event: TouchEvent) => {
		if (!atTop) {
			return;
		}
		currentY = event.touches[0].clientY;
		if (currentY - startY > 10) {
			pulling = true;
			translateY = (currentY - startY) * resistance;
			if (currentY - startY > 100) {
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
			translateY = 50;
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
		}, 1000);
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
			class="fixed md:pl-[200px] top-0 left-0 w-full text-center text-accent animate-bounce transition-all mt-5"
			class:text-primary={shouldRefresh}
		>
			Refresh
		</div>
	{/if}
	<div
		transition:fade
		class="overflow-x-hidden overflow-y-auto flex-1 flex flex-col items-center w-full transition-transform ease-linear"
		style="transform: translateY({translateY}px)"
		onscroll={(event: UIEvent) => {
			const target = event.target;
			if (target) {
				atTop = (target as HTMLElement).scrollTop < 5;
			}
		}}
	>
		{@render children()}
	</div>
</div>
