<script lang="ts">
    import { page } from "$app/stores";
    import BarPlot from "$lib/components/BarPlot.svelte";
    import LineChart from "$lib/components/LineChart.svelte";
    import _ from "lodash";
    import {extent} from "d3-array";
    import PieChart from "$lib/components/PieChart.svelte";

    let { data } = $props();
    let datasetId = $state($page.params.id);

    const courseAverageData = data.results[0].result;
    const deptAverageData = data.results[1].result;
    const passFailData = data.results[2].result.slice(0, 5);
    const barPlotData = courseAverageData.slice(0, Math.min(courseAverageData.length, 10));
    const lineChartData = Object.values(_.groupBy(deptAverageData, (obj: Record<string, string | number>) => obj[`${datasetId}_dept`] as string)).slice(0, 50);
    const [minX, maxX] = extent(deptAverageData, (data: Record<string, string | number>) => new Date(data[`${datasetId}_year`].toString())) as [Date, Date];
    const [minY, maxY] = extent(deptAverageData, (d: Record<string, string | number>) => d[`overallAvg`] as number);
</script>

<div class = "plot">
    <h1>Courses with highest average</h1>
    <BarPlot {barPlotData} {datasetId}/>
</div>

<div class = "plot">
    <h1>Average of departments over the years</h1>
    <LineChart data = {lineChartData} {datasetId} {minX} {maxX} {minY} {maxY}/>
</div>

<div class = "plot">
    <h1>Pass/Fail ratio of courses with the worst average</h1>
    <div class = "pie-charts">
        {#each passFailData as datum}
            <div class = "pie-chart-container">
                <PieChart data = {datum} {datasetId}/>
                <h3>{datum[`${datasetId}_dept`].toUpperCase()} {datum[`${datasetId}_id`]}</h3>
            </div>
        {/each}
    </div>
</div>

<style>
    .plot {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .plot h1 {
        font-size: 2em;
    }

    .pie-charts {
        margin: 20px 0;
        width: 100%;
        display: flex;
        justify-content: space-evenly;
    }

    .pie-chart-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
    }
</style>