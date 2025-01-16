<script lang="ts">
	import { onMount, type Snippet } from "svelte";
	import { fade } from "svelte/transition";

	let {
		onRefresh,
		scrollPosition = $bindable(),
		resistance = 0.1,
		children,
	}: {
		onRefresh: () => void;
		scrollPosition?: number;
		resistance?: number;
		children: Snippet;
	} = $props();

	onMount(() => {
		setTimeout(() => {
			if (scrollPosition) {
				const ref = document.getElementById("scroll-element");
				ref?.scrollTo({
					left: 0,
					top: scrollPosition,
					behavior: "smooth",
				});
			}
		}, 300);
	});

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
			if (currentY - startY > 150) {
				shouldRefresh = true;
			} else {
				translateY = (currentY - startY) * resistance;
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
			class="bg-inherit fixed md:pl-[200px] top-0 left-0 w-full text-center text-accent animate-bounce transition-all mt-5"
			class:text-primary={shouldRefresh}
		>
			Refresh
		</div>
	{/if}
	<div
		transition:fade={{ duration: 1000, delay: 300 }}
		id="scroll-element"
		class="overflow-x-hidden overflow-y-auto no-scrollbar no-scrollbar::-webkit-scrollbar flex-1 flex flex-col items-center w-full transition-transform ease-linear"
		style="transform: translateY({translateY}px);"
		onscroll={(event: UIEvent) => {
			const target = event.target;
			if (target) {
				const currentScroll = (target as HTMLElement).scrollTop;
				atTop = currentScroll < 5;
				if (scrollPosition !== undefined) {
					scrollPosition = currentScroll;
				}
			}
		}}
	>
		{@render children()}
	</div>
</div>

<style>
	@media (min-width: 768px) {
		#scroll-element {
			-ms-overflow-style: scrollbar;
			scrollbar-width: thin;
		}
	}
</style>
