<script lang="ts">
	import { Input } from "../input";

	let { pin = $bindable(), show = true }: { pin: number[]; show?: boolean } =
		$props();
	let inputRefs = $state<(HTMLInputElement | undefined)[]>([
		undefined,
		undefined,
		undefined,
		undefined,
	]);

	const handleKeyDown = (index: number, e: KeyboardEvent) => {
		if (pin[index] != null && pin[index].toString().length > 1) {
			pin[index] = parseInt(pin[index].toString()[0]);
			return;
		}
		if (e.key === "Backspace" && index > 0 && pin[index] === null) {
			inputRefs[index - 1]!.focus();
		} else if (e.key !== "Backspace" && index < 3 && pin[index] !== null) {
			inputRefs[index + 1]!.focus();
			pin[index + 1] = NaN;
		}
	};

	$effect(() => {
		if (show) {
			inputRefs[0]?.focus();
		}
	});
</script>

<div class="input-container">
	{#each pin as _, index}
		<Input
			class="text-center"
			type="number"
			pattern="[0-9]"
			bind:value={pin[index]}
			onkeyup={(e) => handleKeyDown(index, e)}
			bind:ref={inputRefs[index]}
			aria-label={`PIN digit 1`}
		/>
	{/each}
</div>

<style>
	.input-container {
		display: flex;
		justify-content: space-evenly;
		gap: 0.5rem;
	}
</style>
