<script lang="ts">
	import {
		AlignCenterVertical,
		AlignEndVertical,
		AlignStartVertical,
		Plus,
		Trash,
		X,
	} from "lucide-svelte";
	import { link } from "svelte-routing";
	import {
		genPostId,
		type Post,
		type PostContent,
		type PostContentAlign,
	} from "../model/post.model";
	import { getContentNodeState } from "../state/node.svelte";
	import { getWalletState } from "../state/wallet.svelte";
	import { compressImageInput } from "../utils/image.utils";
	import { runDelayed } from "../utils/utils";
	import MainPost from "./MainPost.svelte";
	import AvatarFallback from "./ui/avatar/avatar-fallback.svelte";
	import Avatar from "./ui/avatar/avatar.svelte";
	import { buttonVariants } from "./ui/button";
	import Button from "./ui/button/button.svelte";
	import CardContent from "./ui/card/card-content.svelte";
	import CardFooter from "./ui/card/card-footer.svelte";
	import CardHeader from "./ui/card/card-header.svelte";
	import CardTitle from "./ui/card/card-title.svelte";
	import Card from "./ui/card/card.svelte";
	import Input from "./ui/input/input.svelte";
	import { Select, SelectValue } from "./ui/select";
	import SelectContent from "./ui/select/select-content.svelte";
	import SelectItem from "./ui/select/select-item.svelte";
	import SelectTrigger from "./ui/select/select-trigger.svelte";
	import Textarea from "./ui/textarea/textarea.svelte";

	let preview = $state(false);
	let previewPost = $state<Post>();

	const walletState = getWalletState();
	const nodeState = getContentNodeState();

	let title = $state("");
	let tagInput = $state("");
	let tags = $state<string[]>([]);

	let textAreaElementRef = $state<HTMLTextAreaElement | undefined>();

	let data = $state<Partial<PostContent>[]>([{}]);

	const addTag = (e?: KeyboardEvent): void => {
		if ((e && e.key !== "Enter") || !tagInput) {
			return;
		}
		tags.push(tagInput.trim().toLowerCase());
		tagInput = "";
	};

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

	async function uploadPost(): Promise<void> {
		const id = genPostId();
		if (!id || !walletState.address) {
			return;
		}
		const content: PostContent[] = [];
		// replace image data with ContentID
		for (const item of data) {
			if (!item.data) {
				continue;
			}
			if (item.type === "TEXT") {
				content.push({
					privacy: "PUBLIC",
					type: "TEXT",
					data: item.data,
					align: item.align || "left",
				});
				continue;
			}
			const uploadNumber = await nodeState.uploadImage(
				id,
				walletState.address,
				item.data,
			);
			const contentId = `${walletState.address}:${id}:${uploadNumber}`;
			content.push({
				privacy: item.privacy || "PUBLIC",
				type: "IMG",
				data: contentId,
				align: item.align || "left",
			});
		}

		let postData: Post = {
			id,
			tags,
			title,
			uploader: walletState.address,
			content,
		};
		console.log("DATA: ", postData);
		previewPost = postData;
		preview = true;
		// 	const tx = await ArweaveUtils.newPostTx(postData);
		// 	await walletState.wallet.dispatch(tx);
	}

	function hidePreview(): void {
		preview = false;
	}

	async function mediaSelected(index: number, event: Event): Promise<void> {
		const fileList: FileList | null = (event.target as HTMLInputElement)
			.files;
		if (fileList && fileList[0]) {
			if (!data[index]) {
				return;
			}
			data[index].data = await compressImageInput(fileList[0]);
			console.log(data[index]);
		}
	}
</script>

{#if !preview}
	<div class="flex-1 flex flex-col items-center w-full max-h-full">
		<Card class="max-w-[500px] w-full m-5">
			<div class="flex p-6 pb-3 w-full">
				<Avatar class="inline-flex">
					<AvatarFallback
						>{walletState.address.slice(0, 2)}</AvatarFallback
					>
				</Avatar>
				<CardHeader class="inline-flex pt-0 w-full">
					<CardTitle>
						<Input placeholder="Title..." bind:value={title} />
					</CardTitle>
				</CardHeader>
			</div>
			<CardContent class="p-0">
				<div
					class="inline-flex w-full overflow-x-scroll scroll-smooth snap-x snap-mandatory max-h-[70vh]"
				>
					{#each data as content, i}
						<div
							id={"content_" + i}
							class="min-w-full box-content snap-start inline-flex justify-center min-h-[45vh]"
						>
							<div class="flex-1 flex flex-col">
								<div
									class="w-full flex justify-end border-y-2"
									class:justify-between={content.type}
								>
									{#if content.type === "IMG"}
										<Select
											selected={{
												value: content.privacy,
											}}
											onSelectedChange={(v) => {
												if (!v) {
													return;
												}
												content.privacy = v?.value;
											}}
										>
											<SelectTrigger class="m-x-2 w-1/2">
												<SelectValue
													placeholder="Public"
												/>
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
												variant={content.align ===
												"left"
													? "default"
													: "ghost"}
												onclick={() =>
													(content.align = "left")}
												size="icon"
											>
												<AlignStartVertical />
											</Button>
											<Button
												variant={content.align ===
												"center"
													? "default"
													: "ghost"}
												onclick={() =>
													(content.align = "center")}
												size="icon"
											>
												<AlignCenterVertical />
											</Button>
											<Button
												variant={content.align ===
												"right"
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
									<Button
										variant="ghost"
										size="icon"
										onclick={() => deleteData(i)}
									>
										<X />
									</Button>
								</div>
								{#if !content.type}
									<div
										class="flex-1 flex items-center justify-center flex-col gap-2 border-2"
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
											bind:inputRef={textAreaElementRef}
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
			<CardFooter class="pt-3 flex flex-col">
				<div class="flex justify-center items-center w-full">
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
							class="p-3 w-6 h-6 flex items-center justify-center hover:bg-neutral-500 opacity-50 rounded-full cursor-pointer mx-2"
						>
							{i + 1}
						</span>
					{/each}
					<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
					<span
						onclick={() => {
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
				<br />
				<div class=" w-full flex justify-start">
					<Input
						placeholder="Add Tag..."
						class="w-1/2 max-w-[100px]"
						onkeydown={addTag}
						bind:value={tagInput}
					/>
					<Button variant="ghost" size="icon" onclick={() => addTag()}
						><Plus /></Button
					>
					<div class="flex-1 flex flex-wrap h-auto">
						{#each tags as tag}
							<small class="m-2">{tag}</small>
						{/each}
					</div>
					<Button
						variant="ghost"
						size="icon"
						onclick={() => {
							tags = tags.slice(0, tags.length - 1);
						}}><Trash /></Button
					>
				</div>
			</CardFooter>
		</Card>
		<div class="max-w-[500px] w-full mx-5 flex justify-between">
			<a
				href="/"
				use:link
				class={buttonVariants({ variant: "secondary" })}
			>
				Cancel
			</a>
			<Button onclick={() => uploadPost()}>Submit</Button>
		</div>
	</div>
{:else if previewPost}
	<div class="flex-1 flex flex-col items-center w-full max-h-full">
		<MainPost data={previewPost}></MainPost>
		<Button onclick={() => hidePreview()}>Back</Button>
	</div>
{/if}
