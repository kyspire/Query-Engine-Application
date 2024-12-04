import { PRIVATE_BASE_URL } from '$env/static/private';

export async function load() {
	const response = await fetch(`${PRIVATE_BASE_URL}/datasets`);
	const datasets = await response.json();
	return {
		datasets,
		baseUrl: PRIVATE_BASE_URL
	};
}
