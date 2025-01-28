<script lang="ts">
	import {
		AlignCenterVertical,
		AlignEndVertical,
		AlignStartVertical,
		Plus,
		X,
	} from "lucide-svelte";
	import { POST_MAX_NUMBER_OF_CONTENT } from "../../constants";
	import {
		type PostAge,
		type PostContent,
		type PostContentAlign,
		type PostContentPrivacy,
	} from "../../models/post.model";
	import { runDelayed } from "../../utils/common.utils";
	import { compressImageInput } from "../../utils/image.utils";
	import Button from "../ui/button/button.svelte";
	import { Card, CardContent, CardFooter } from "../ui/card";
	import Input from "../ui/input/input.svelte";
	import { Select } from "../ui/select";
	import SelectContent from "../ui/select/select-content.svelte";
	import SelectItem from "../ui/select/select-item.svelte";
	import SelectTrigger from "../ui/select/select-trigger.svelte";
	import Textarea from "../ui/textarea/textarea.svelte";

	let {
		data = $bindable(),
		age = $bindable(),
	}: { data: Partial<PostContent>[]; age: PostAge } = $props();

	let textAreaElementRef = $state<HTMLTextAreaElement | null>(null);

	function deleteData(index: number): void {
		if (data.length < 2) {
			data = [{}];
			return;
		}
		data = data.filter((_, i) => i !== index);
	}
	function textAlignClass(align?: PostContentAlign): string {
		if (align === "left") {
			return " text-left";
		} else if (align === "center") {
			return " text-center";
		} else if (align === "right") {
			return " text-right";
		}
		return "";
	}

	async function mediaSelected(index: number, event: Event): Promise<void> {
		const fileList: FileList | null = (event.target as HTMLInputElement)
			.files;
		if (fileList && fileList[0]) {
			if (!data[index]) {
				return;
			}
			data[index].data = await compressImageInput(fileList[0]);
		}
	}
</script>

<Card class="max-w-[450px] w-full m-5 border-none">
	<!-- <CardHeader class="p-0 items-center">
		<Select type="single" bind:value={age}>
			<SelectTrigger class="m-x-2 w-fit gap-5 border-none">
				<SelectValue placeholder="Age: 12+" />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="3+">Age: 3+</SelectItem>
				<SelectItem value="12+">Age: 12+</SelectItem>
				<SelectItem value="16+">Age: 16+</SelectItem>
				<SelectItem value="18+">Age: 18+</SelectItem>
			</SelectContent>
		</Select>
	</CardHeader> -->
	<CardContent class="p-0 border-2">
		<div
			class="inline-flex w-full overflow-x-scroll overflow-y-hidden scroll-smooth snap-x snap-mandatory max-h-[70vh]"
			style="scrollbar-color: rgba(128, 128, 128, .5) rgba(0, 0, 0, 0); scrollbar-width: thin;"
		>
			{#each data as content, i}
				<div
					id={"content_" + i}
					class="min-w-full box-content snap-start inline-flex justify-center min-h-[50dvh]"
				>
					<div class="flex-1 flex flex-col">
						<div
							class="w-full flex justify-end"
							class:justify-between={content.type}
						>
							{#if content.type === "IMG"}
								<Select
									type="single"
									value={content.privacy as string}
									onValueChange={(v) => {
										if (!v) {
											return;
										}
										content.privacy =
											v as PostContentPrivacy;
									}}
								>
									<SelectTrigger
										class="m-x-2 w-fit gap-3 border-none focus:ring-transparent"
									>
										{(content.privacy
											?.slice(0, 1)
											?.toUpperCase() || "P") +
											(content?.privacy
												?.slice(1)
												.toLowerCase() || "ublic")}
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="PUBLIC"
											>Public</SelectItem
										>
										<SelectItem value="PRIVATE"
											>Private</SelectItem
										>
									</SelectContent>
								</Select>
							{:else if content.type === "TEXT"}
								<div>
									<Button
										variant={content.align === "left"
											? "default"
											: "ghost"}
										onclick={() => (content.align = "left")}
										size="icon"
									>
										<AlignStartVertical />
									</Button>
									<Button
										variant={content.align === "center"
											? "default"
											: "ghost"}
										onclick={() =>
											(content.align = "center")}
										size="icon"
									>
										<AlignCenterVertical />
									</Button>
									<Button
										variant={content.align === "right"
											? "default"
											: "ghost"}
										onclick={() =>
											(content.align = "right")}
										size="icon"
									>
										<AlignEndVertical />
									</Button>
								</div>
							{/if}
							{#if data.length > 1 || content.type}
								<Button
									variant="ghost"
									size="icon"
									onclick={() => deleteData(i)}
								>
									<X />
								</Button>
							{/if}
						</div>
						{#if !content.type}
							<div
								class="flex-1 flex items-center justify-center flex-col gap-2"
							>
								<Button
									onclick={() => {
										content.type = "TEXT";
										runDelayed(() => {
											textAreaElementRef?.focus();
										});
									}}>Text</Button
								>
								<Button
									onclick={() => {
										content.type = "IMG";
										content.privacy = "PUBLIC";
									}}>Image</Button
								>
							</div>
						{:else if content.type === "TEXT"}
							<div class="flex-1 flex p-2">
								<Textarea
									bind:ref={textAreaElementRef}
									bind:value={content.data}
									class={"flex-1 w-full p-3 font-mono text-base resize-none" +
										textAlignClass(content.align)}
									maxlength={350}
								></Textarea>
							</div>
						{:else if content.type === "IMG"}
							{#if !content.data}
								<div
									class=" flex-1 flex items-center justify-center"
								>
									<Input
										class="w-min cursor-pointer before:cursor-pointer hover:border-slate-400"
										type="file"
										accept="image/*"
										onchange={(event: Event) =>
											mediaSelected(i, event)}
									/>
								</div>
							{:else}
								<img
									class="h-full object-contain"
									src={content.data}
									alt={"image_" + i}
								/>
							{/if}
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</CardContent>
	<CardFooter class="p-3 flex flex-col">
		<div class="flex justify-center w-full flex-wrap">
			{#each data as _, i}
				<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
				<span
					onclick={() => {
						const id = "content_" + i;
						const elem = document.getElementById(id);
						elem?.scrollIntoView({
							behavior: "smooth",
							block: "center",
						});
					}}
					class="px-2 w-6 h-6 flex items-center text-xs font-extrabold justify-center hover:bg-slate-500 opacity-50 rounded-full cursor-pointer mx-2"
				>
					{i + 1}
				</span>
			{/each}
			<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
			<span
				onclick={() => {
					if (data.length >= POST_MAX_NUMBER_OF_CONTENT) {
						return;
					}
					data.push({});
					runDelayed(() => {
						const id = "content_" + (data.length - 1);
						const elem = document.getElementById(id);
						elem?.scrollIntoView({
							behavior: "smooth",
							block: "center",
						});
					});
				}}
				class="border-2 border-primary flex items-center justify-center hover:bg-slate-500 opacity-50 rounded-full cursor-pointer"
			>
				<Plus class="w-6 h-6 text-primary" />
			</span>
		</div>
		<Select type="single" bind:value={age}>
			<SelectTrigger class="m-x-2 w-fit gap-5 border-none mt-3">
				Age: {age}
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="3+">Age: 3+</SelectItem>
				<SelectItem value="12+">Age: 12+</SelectItem>
				<SelectItem value="16+">Age: 16+</SelectItem>
				<SelectItem value="18+">Age: 18+</SelectItem>
			</SelectContent>
		</Select>
	</CardFooter>
</Card>
