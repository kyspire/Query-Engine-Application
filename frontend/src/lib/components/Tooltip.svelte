<script>
    export let data;
    export let datasetId;
    export let x;
    export let y;
</script>

<div style="position: absolute; top: {y - 90}px; left: {x}px">
    <p>{data[`${datasetId}_dept`].toUpperCase()}</p>
</div>