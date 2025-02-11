<!-- TermsOfUse.svelte -->
<script>
	const serviceName = "Veracy.app";
	const lastUpdated = "2025-02-02";
	const contactEmail = "csermely.a.dev@gmail.com";

	$effect(() => {
		document.title = "Terms of Use";
		return () => {
			document.title = "Veracy";
		};
	});
</script>

<div class="p-16 text-primary overflow-auto min-w-full">
	<h1 class="text-5xl font-bold mb-8">Terms of Use</h1>

	<div class="mb-12">
		<p class="text-sm text-secondary-foreground">
			Last Updated: {lastUpdated}
		</p>
	</div>

	<!-- Acceptance Section -->
	<section class="mb-8">
		<h2 class="text-xl font-semibold mb-4">1. Acceptance</h2>
		<p class="mb-4">
			By using {serviceName}, you agree to these Terms and our
			<a href="/privacy-policy" class="text-blue-600 hover:underline"
				>Privacy Policy</a
			>.
		</p>
	</section>

	<!-- Service Overview -->
	<section class="mb-8">
		<h2 class="text-xl font-semibold mb-4">2. Service Overview</h2>
		<p class="mb-4">We provide a platform to:</p>
		<ul class="list-disc pl-6 mb-4 space-y-2">
			<li>
				Upload and share images publicly or restrict access via Arweave
				blockchain payments
			</li>
			<li>Authenticate users via RSA public keys</li>
		</ul>
	</section>

	<!-- User Responsibilities -->
	<section class="mb-8">
		<h2 class="text-xl font-semibold mb-4">3. Your Responsibilities</h2>
		<p class="mb-4">You agree to:</p>
		<ul class="list-disc pl-6 space-y-3">
			<li>
				Safeguard your private key; <strong
					>we cannot recover lost keys</strong
				>
			</li>
			<li>Label content with accurate age ratings (12+, 16+, 18+)</li>
			<li>Avoid illegal/harmful material</li>
		</ul>
	</section>

	<!-- Content & Ownership -->
	<section class="mb-8">
		<h2 class="text-xl font-semibold mb-4">4. Content & Ownership</h2>
		<ul class="list-disc pl-6 space-y-3">
			<li>
				You own uploaded images but grant us a license to operate the
				service
			</li>
			<li>
				Blockchain metadata (e.g., payments) is permanent and public
			</li>
		</ul>
	</section>

	<!-- Payments -->
	<section class="mb-8">
		<h2 class="text-xl font-semibold mb-4">5. Payments</h2>
		<p class="mb-4">
			Paid content requires blockchain verification. <strong
				>All transactions are final.</strong
			>
		</p>
	</section>

	<!-- Termination -->
	<section class="mb-8">
		<h2 class="text-xl font-semibold mb-4">6. Termination</h2>
		<p class="mb-4">
			Delete your account/data anytime in Settings. We may suspend
			violating accounts.
		</p>
	</section>

	<!-- Disclaimers -->
	<section class="mb-8">
		<h2 class="text-xl font-semibold mb-4">7. Disclaimers</h2>
		<ul class="list-disc pl-6 space-y-3">
			<li>Service provided "as is"</li>
			<li>We are not liable for Arweave's performance or lost keys</li>
		</ul>
	</section>

	<!-- Governing Law -->
	<section class="mb-8">
		<h2 class="text-xl font-semibold mb-4">8. Governing Law</h2>
		<p class="mb-4">
			Hungarian law applies. Disputes resolved in Hungarian courts.
		</p>
	</section>

	<!-- Changes -->
	<section class="mb-8">
		<h2 class="text-xl font-semibold mb-4">9. Changes</h2>
		<p class="mb-4">
			We may update these Terms. Continued use = acceptance.
		</p>
	</section>

	<!-- Contact -->
	<section class="mt-12 pt-8 border-t border-secondary">
		<h3 class="text-lg font-semibold mb-2">Contact</h3>
		<p class="text-blue-600 hover:underline">
			<a href="mailto:{contactEmail}">{contactEmail}</a>
		</p>
	</section>
</div>
