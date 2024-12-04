<script lang="ts">
	import { onMount } from 'svelte';
	import { Trash2 } from 'lucide-svelte';

	let { data } = $props();
	let result = $state(data.datasets.result || []);
	let baseUrl = data.baseUrl;
	let selectedFile = $state<File | null>(null);
	let datasetId = $state<string>('');
	let selection = $state<string>('sections');

	async function fetchData() {
		try {
			const response = await fetch(`${baseUrl}/datasets`);
			if (response.ok) {
				const newData = await response.json();
				result = newData.result || newData;
			} else {
				console.error('Failed to fetch datasets');
			}
		} catch (error) {
			console.error('Error fetching datasets:', error);
		}
	}

	async function handleDelete(datasetId: string) {
		try {
			const url = new URL(`${baseUrl}/dataset/${datasetId}`);
			const response = await fetch(url.toString(), {
				method: 'DELETE'
			});

			if (response.ok) {
				result = result.filter((dataset) => dataset.id !== datasetId);
				alert(`Dataset ${datasetId} deleted successfully!`);
			} else {
				alert('Failed to delete dataset. Please try again.');
			}
		} catch (error) {
			alert('Error deleting dataset: ' + (error as Error).message);
		}
	}

	onMount(fetchData);

	const handleFileChange = (event: Event) => {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			selectedFile = input.files[0];
			console.log('Selected file:', selectedFile);
		}
	};

	const resetForm = () => {
		selectedFile = null;
		datasetId = '';
		selection = 'sections';
	};

	const handleSubmit = async () => {
		if (selectedFile && datasetId) {
			console.log('Uploading file:', selectedFile);
			console.log('Dataset ID:', datasetId);
			console.log('Selected Section or Room:', selection);

			const url = new URL(`${baseUrl}/dataset/${datasetId}/${selection}`);

			try {
				const response = await fetch(url.toString(), {
					method: 'PUT',
					body: selectedFile
				});

				if (response.ok) {
					await fetchData();
					alert(`Dataset ${datasetId} uploaded successfully!`);
					//result = [...result, { id: datasetId }];
					resetForm();
				} else {
					const { error } = await response.json();
					alert(`Failed to upload dataset. Reason: ${error}`);
					resetForm();
				}
			} catch (error) {
				alert('Error during dataset upload: ' + (error as Error).message);
				resetForm();
			}
		} else {
			alert('Please select a file and provide a Dataset ID.');
			resetForm();
		}
	};
</script>

<nav class="bg-base-100">
	<div class="container navbar mx-auto flex items-center justify-center space-x-2">
		<img src="ubclogo.png" alt="UBC Logo" class="h-6 w-6" />
		<h1 class="text-xl">UBC Insights</h1>
	</div>
</nav>

<h2 class="mb-4 text-center text-2xl font-semibold">Current Datasets</h2>
<table class="h-full w-full table-auto border-collapse border border-gray-300">
	<thead>
		<tr>
			<th class="w-16 border border-gray-400 px-4 py-2">Delete Dataset</th>
			<th class="border border-gray-400 px-4 py-2">Dataset ID</th>
		</tr>
	</thead>
	<tbody class="overflow-auto">
		{#each result as dataset}
			<tr>
				<td class="border border-gray-400 px-4 py-2 text-center">
					<button
						onclick={() => handleDelete(dataset.id)}
						class="text-gray-600 transition-colors hover:text-red-600"
						title="Delete dataset"
					>
						<Trash2 size={18} />
					</button>
				</td>
				<td class="border border-gray-400 px-4 py-2">
					<a href={`/dataset/${dataset.id}`} class="text-blue-500 hover:underline">
						{dataset.id}
					</a>
				</td>
			</tr>
		{/each}
	</tbody>
</table>

<!-- Upload Dataset Section -->
<div class="mt-8 text-center">
	<h3 class="mb-4 text-xl font-semibold">Upload Dataset</h3>

	<!-- File input and upload button -->
	<input type="file" accept=".zip" onchange={handleFileChange} class="mb-4 rounded border p-2" />

	<!-- Dataset ID Input -->
	<div class="mt-4">
		<label for="datasetId" class="block text-lg font-medium">Enter Dataset ID</label>
		<input
			id="datasetId"
			type="text"
			bind:value={datasetId}
			class="mt-2 w-48 rounded border p-2"
			placeholder="Dataset ID"
		/>
	</div>

	<!-- Dropdown Selection -->
	<div class="mt-4">
		<label for="selection" class="block text-lg font-medium">Choose Type</label>
		<select id="selection" bind:value={selection} class="mt-2 w-48 rounded border p-2">
			<option value="sections">Sections</option>
			<option value="rooms">Rooms</option>
		</select>
	</div>

	<!-- Display the selected file's name -->
	{#if selectedFile}
		<p class="mt-4 text-gray-700">Selected file: {selectedFile.name}</p>
	{/if}

	<!-- Submit Button -->
	<div class="mt-4">
		<button
			onclick={handleSubmit}
			class="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
		>
			Submit Dataset Info
		</button>
	</div>
</div>
