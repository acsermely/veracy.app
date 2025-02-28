<script lang="ts">
	import { User } from "lucide-svelte";
	import { link } from "svelte-routing";
	import { ArweaveUtils } from "../../utils/arweave.utils";
	import { DB } from "../../utils/db.utils";
	import AvatarFallback from "../ui/avatar/avatar-fallback.svelte";
	import AvatarImage from "../ui/avatar/avatar-image.svelte";
	import Avatar from "../ui/avatar/avatar.svelte";

	const { selectedId } = $props<{ selectedId?: string }>();
	let followedUsers = $state<
		Array<{ address: string; username?: string; img?: string }>
	>([]);

	$effect(() => {
		loadFollowedUsers();
	});

	async function loadFollowedUsers() {
		try {
			const friends = await DB.friend.getAll();
			followedUsers = friends.map((friend) => ({
				address: friend.id,
				username: undefined,
				img: undefined,
			}));

			// Load usernames and images for each friend
			for (const user of followedUsers) {
				const profile = await ArweaveUtils.getLatestProfile(
					user.address,
				);
				if (profile) {
					user.username = profile.username;
					user.img = profile.img;
					followedUsers = [...followedUsers]; // Trigger reactivity
				}
			}
		} catch (error) {
			console.error("Failed to load friends:", error);
			followedUsers = [];
		}
	}
</script>

<div
	class="w-64 h-full bg-background border-r border-secondary flex flex-col shadow-lg lg:shadow-none"
>
	<div class="p-4 border-b border-secondary">
		<h2 class="text-lg font-semibold">Messages</h2>
	</div>
	<div class="flex-1 overflow-y-auto">
		{#if followedUsers.length === 0}
			<div class="p-4 text-center text-secondary">
				No followed users yet
			</div>
		{:else}
			{#each followedUsers as user}
				<a
					href="/chat/{user.address}"
					class="w-full p-4 flex items-center gap-3 hover:bg-secondary/10 transition-colors {selectedId ===
					user.address
						? 'bg-secondary/20'
						: ''}"
					use:link
				>
					<Avatar
						class="size-10 bg-gradient-to-bl from-amber-500 via-blue-500 to-teal-500 bg-opacity-50"
					>
						<AvatarImage src={user.img} />
						<AvatarFallback
							class="font-extrabold bg-transparent text-white"
						>
							{#if user.img}
								{user.address.slice(0, 3)}
							{:else}
								<User size={20} />
							{/if}
						</AvatarFallback>
					</Avatar>
					<div class="flex-1 text-left">
						<div class="font-medium">
							{user.username || user.address.slice(0, 8) + "..."}
						</div>
					</div>
				</a>
			{/each}
		{/if}
	</div>
</div>
