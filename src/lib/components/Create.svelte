<script lang="ts">
	import { link } from "svelte-routing";
	import { toast } from "svelte-sonner";
	import {
		genPostId,
		type Post,
		type PostContent,
	} from "../model/post.model";
	import { getDialogsState } from "../state/dialogs.svelte";
	import { getLocalWalletState } from "../state/local-wallet.svelte";
	import { getContentNodeState } from "../state/node.svelte";
	import { ArweaveUtils } from "../utils/arweave.utils";
	import { hasPrivateContent } from "../utils/common.utils";
	import CreateContent from "./CreateContent.svelte";
	import CreateDetails from "./CreateDetails.svelte";
	import CreateFinish from "./CreateFinish.svelte";
	import CreateUpload from "./CreateUpload.svelte";
	import { buttonVariants } from "./ui/button";
	import Button from "./ui/button/button.svelte";

	let currentStep = $state(0);
	let uploading = $state(false);
	let uploadMessage = $state("");

	const walletState = getLocalWalletState();
	const nodeState = getContentNodeState();
	const dialogsState = getDialogsState();

	let title = $state(undefined);
	let price = $state<number>();
	let tags = $state<string[]>([""]);
	let data = $state<Partial<PostContent>[]>([{}]);
	let fullPostData = $state<Post>();

	async function uploadPost(): Promise<void> {
		const id = genPostId();
		if (!id || !walletState.wallet) {
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
		fullPostData = postData;
		const tx = await ArweaveUtils.newPostTx(postData);
		await walletState.wallet.dispatch(tx);

		return;
	}

	function nextStep(): void {
		if (currentStep == 0) {
			if (data.length < 1 || !data[0]?.data) {
				toast.error("Add content first!");
				return;
			}
		} else if (currentStep == 1) {
			if (hasPrivateContent(data) && !price) {
				toast.error("You need to set Price for Private Content");
				return;
			}
			tags = tags.filter((tag) => tag);
		} else if (currentStep == 2) {
			if (!nodeState.isConnected || !walletState.isConnected) {
				toast.error("Login with your Wallet");
				return;
			}
			uploading = true;
			uploadPost()
				.then(() => {
					uploadMessage = "Uploaded Successfully!";
				})
				.catch((e) => {
					console.error(e);
					uploadMessage = "Upload Failed!";
				})
				.finally(() => (uploading = false));
		}
		currentStep += 1;
	}

	function prevStep(): void {
		currentStep -= 1;
	}
</script>

<div class="flex-1 flex flex-col items-center w-full max-h-full">
	{#if !walletState.isConnected && currentStep == 2}
		<Button
			class="max-w-[450px] w-full m-5 mb-0"
			variant="destructive"
			onclick={() => (dialogsState.connectDialog = true)}
			>Login to continue</Button
		>
	{:else if currentStep < 3}
		<div class="max-w-[450px] w-full m-5 mb-0 flex justify-between">
			{#if currentStep < 1}
				<a
					href="/"
					use:link
					class={buttonVariants({ variant: "secondary" })}
				>
					Cancel
				</a>
			{:else}
				<Button variant="secondary" onclick={() => prevStep()}
					>Back</Button
				>
			{/if}
			<Button onclick={() => nextStep()}>
				{currentStep > 1 ? "Submit" : "Next"}</Button
			>
		</div>
	{/if}
	{#if currentStep == 0}
		<CreateContent bind:data />
	{:else if currentStep == 1}
		<CreateDetails
			bind:tags
			bind:title
			bind:price
			needPrice={hasPrivateContent(data)}
		/>
	{:else if currentStep == 2}
		<CreateUpload {data} {title} {tags} />
	{:else if currentStep == 3}
		<CreateFinish
			bind:data={fullPostData}
			bind:uploading
			bind:uploadMessage
			bind:price
			needPayment={hasPrivateContent(data)}
		/>
	{/if}
</div>
