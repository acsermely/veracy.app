<script lang="ts">
	import { Loader } from "lucide-svelte";
	import { toast } from "svelte-sonner";
	import type { ProfileData } from "../../../models/user.model";
	import { getDialogsState } from "../../../state/dialogs.svelte";
	import { getWalletState } from "../../../state/wallet.svelte";
	import { ArweaveUtils } from "../../../utils/arweave.utils";
	import { debounce } from "../../../utils/common.utils";
	import { DB } from "../../../utils/db.utils";
	import { compressImageInput } from "../../../utils/image.utils";
	import { Button } from "../../ui/button";
	import { Dialog } from "../../ui/dialog";
	import DialogContent from "../../ui/dialog/dialog-content.svelte";
	import DialogDescription from "../../ui/dialog/dialog-description.svelte";
	import DialogHeader from "../../ui/dialog/dialog-header.svelte";
	import DialogTitle from "../../ui/dialog/dialog-title.svelte";
	import Input from "../../ui/input/input.svelte";
	import { Label } from "../../ui/label";

	const dialogsState = getDialogsState();
	const walletState = getWalletState();

	let profile = $state<ProfileData>({
		username: "",
	});
	let uploading = $state(false);
	let usernameExists = $state(false);
	let checkingUsername = $state(false);
	let originalUsername = $state<string>();

	// Load existing profile when dialog opens
	$effect(() => {
		if (dialogsState.profileDialog && walletState.wallet?.address) {
			ArweaveUtils.getLatestProfile(walletState.wallet.address).then(
				(existingProfile) => {
					if (existingProfile) {
						profile = existingProfile;
						originalUsername = existingProfile.username;
					}
				},
			);
		}
	});

	const checkUsernameExists = debounce((username) => {
		if (!username || username === originalUsername) {
			usernameExists = false;
			return;
		}
		checkingUsername = true;
		ArweaveUtils.checkUsernameExists(username)
			.then((exists) => {
				usernameExists = exists;
			})
			.finally(() => {
				checkingUsername = false;
			});
	}, 500);

	$effect(() => {
		usernameExists = false;
		if (!profile.username) {
			return;
		}
		if (profile.username === originalUsername) {
			return;
		}
		checkingUsername = true;
		checkUsernameExists(profile.username);
	});

	async function mediaSelected(event: Event): Promise<void> {
		const fileList: FileList | null = (event.target as HTMLInputElement)
			.files;
		if (fileList && fileList[0]) {
			try {
				profile.img = await compressImageInput(
					fileList[0],
					100,
					50 * 1024, // 100px wide, under 50kb
				);
			} catch {
				toast.error("Image processing failed!");
			}
		}
	}

	async function submitProfile(): Promise<void> {
		if (!walletState.wallet) {
			return;
		}
		uploading = true;
		try {
			const profileTx = await ArweaveUtils.newProfileTx(profile);
			await ArweaveUtils.dispatch(walletState.wallet, profileTx);
			await DB.profile.remove(walletState.wallet.address);
			dialogsState.profileDialog = false;
			toast.success("Profile updated!");
		} catch (e) {
			console.error(e);
			toast.error("Failed to update profile!");
		} finally {
			uploading = false;
		}
	}
</script>

<Dialog
	bind:open={dialogsState.profileDialog}
	onOpenChange={(open) => {
		if (!open) {
			profile = {
				username: "",
			};
			originalUsername = undefined;
			usernameExists = false;
			checkingUsername = false;
		}
	}}
>
	<DialogContent
		class="transition-transform w-full max-w-[450px]"
		onOpenAutoFocus={(e) => {
			e.preventDefault();
		}}
	>
		<DialogHeader>
			<DialogTitle>Edit Profile</DialogTitle>
			<DialogDescription
				>Update your profile information</DialogDescription
			>
		</DialogHeader>

		<div class="flex w-full items-center gap-4">
			<div
				class="flex rounded-full border-2 min-w-16 min-h-16 justify-center items-center"
			>
				{#if !profile.img}
					<Label
						class="cursor-pointer w-fit text-center p-3"
						for="profile-avatar"
					>
						Img
					</Label>
					<Input
						id="profile-avatar"
						class="hidden"
						type="file"
						accept="image/*"
						onchange={mediaSelected}
					/>
				{:else}
					<button
						onclick={() => {
							profile.img = undefined;
						}}
					>
						<img
							class="flex rounded-full border-2 min-w-16 min-h-16 max-w-16 max-h-16 justify-center items-center object-cover"
							src={profile.img}
							alt="avatar"
						/>
					</button>
				{/if}
			</div>
			<div class="flex flex-col w-full relative">
				<Input
					id="username"
					class={usernameExists &&
					profile.username !== originalUsername
						? "border-destructive border-2"
						: ""}
					placeholder="Enter username..."
					maxlength={25}
					bind:value={profile.username}
				/>
				<span
					class="absolute -bottom-6 right-2 text-muted-foreground text-xs"
					class:animate-pulse={checkingUsername}
				>
					{#if usernameExists && profile.username !== originalUsername}
						Username Already Taken
					{:else if checkingUsername}
						Checking...
					{/if}
				</span>
			</div>
		</div>

		<Button
			class="mt-3"
			disabled={!profile.username ||
				!profile.img ||
				(usernameExists && profile.username !== originalUsername) ||
				checkingUsername}
			onclick={submitProfile}
		>
			{#if uploading}
				<Loader class="animate-spin m-2" />
			{:else}
				Save Profile
			{/if}
		</Button>
	</DialogContent>
</Dialog>
