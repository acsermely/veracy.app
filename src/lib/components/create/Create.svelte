<script lang="ts">
	import { link } from "svelte-routing";
	import { toast } from "svelte-sonner";
	import {
		genPostId,
		type Post,
		type PostAge,
		type PostContent,
	} from "../../models/post.model";
	import { getDialogsState } from "../../state/dialogs.svelte";
	import { getContentNodeState } from "../../state/node.svelte";
	import { getWalletState } from "../../state/wallet.svelte";
	import { ArweaveUtils } from "../../utils/arweave.utils";
	import {
		createSHA256Hash,
		hasPrivateContent,
	} from "../../utils/common.utils";
	import { buttonVariants } from "../ui/button";
	import Button from "../ui/button/button.svelte";
	import CreateContent from "./CreateContent.svelte";
	import CreateFinish from "./CreateFinish.svelte";
	import CreateUpload from "./CreateUpload.svelte";

	let currentStep = $state(0);
	let uploading = $state(false);
	let uploadMessage = $state("");

	const walletState = getWalletState();
	const nodeState = getContentNodeState();
	const dialogsState = getDialogsState();

	let age = $state<PostAge>("12+");
	let tags = $state<string[]>([""]);
	let data = $state<Partial<PostContent>[]>([{ align: "center" }]);
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
			const hash = await createSHA256Hash(item.data);
			if (item.type === "TEXT") {
				content.push({
					privacy: "PUBLIC",
					type: "TEXT",
					data: item.data,
					hash,
					align: item.align || "left",
				} as PostContent);
				continue;
			}
			const uploadNumber = await nodeState.uploadImage(
				id,
				walletState.wallet.address,
				item.data,
			);
			const contentId = `${walletState.wallet.address}:${id}:${uploadNumber}`;
			content.push({
				privacy: item.privacy || "PUBLIC",
				type: "IMG",
				data: contentId,
				hash,
				align: item.align || "left",
			} as PostContent);
		}

		let postData: Post = {
			id,
			age,
			uploader: walletState.wallet.address,
			content,
		};
		fullPostData = postData;
		const tx = await ArweaveUtils.newPostTx(postData);
		await ArweaveUtils.dispatch(walletState.wallet, tx);
		return;
	}

	function nextStep(): void {
		if (currentStep == 0) {
			if (data.length < 1 || !data[0]?.data) {
				toast.error("Add content first!");
				return;
			}
			data = data.filter((item) => item.data);
		} else if (currentStep == 1) {
			if (!nodeState.isConnected || !walletState.hasWallet) {
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

<div
	class="flex-1 flex flex-col items-center w-full max-h-full overflow-y-auto no-scrollbar no-scrollbar::-webkit-scrollbar"
>
	{#if !walletState.hasWallet && currentStep == 1}
		<Button
			class="max-w-[450px] w-full m-5 mb-0"
			variant="destructive"
			onclick={() => (dialogsState.connectDialog = true)}
			>Login to continue</Button
		>
	{:else if currentStep < 2}
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
				{currentStep > 0 ? "Submit" : "Preview"}</Button
			>
		</div>
	{/if}
	{#if currentStep == 0}
		<CreateContent bind:data bind:age />
		<!-- {:else if currentStep == 1}
		<CreateDetails
			bind:tags
			bind:title
			bind:price
			needPrice={hasPrivateContent(data)}
		/> -->
	{:else if currentStep == 1}
		<CreateUpload {data} {age} {tags} />
	{:else if currentStep == 2}
		<CreateFinish
			bind:data={fullPostData}
			bind:uploading
			bind:uploadMessage
			needPayment={hasPrivateContent(data)}
		/>
	{/if}
</div>
