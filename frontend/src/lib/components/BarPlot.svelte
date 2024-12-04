<script lang="ts">
    import { scaleLinear} from 'd3-scale';
    import _ from "lodash";
    import Rect from "$lib/components/Rect.svelte";

    let { barPlotData, datasetId }: {barPlotData: Record<string, string | number>, datasetId: string} = $props();

    let barPlotDataCopy = _.cloneDeep(barPlotData);

    let displayData = $state(barPlotDataCopy.map((data: Record<string, string | number>) => ({
        ...data,
        [`${datasetId}_avg`]: 0
    })));

    // Update to actual values after delay
    setTimeout(() => {
        displayData = barPlotDataCopy;
    }, 100);

    const yTicks = [90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100];
    const padding = { top: 20, right: 15, bottom: 20, left: 25 };

    let width = $state(500);
    let xScale = $derived(
        scaleLinear()
            .domain([0, displayData.length]) // Use displayData instead of barPlotData
            .range([padding.left, width - padding.right])
    );
    let height = 700;
    let yScale = scaleLinear()
        .domain([90, Math.max.apply(null, yTicks)])
        .range([height - padding.bottom, padding.top]);
    let innerWidth = $derived(width - (padding.left + padding.right));
    let barWidth = $derived(innerWidth / displayData.length); // Use displayData here too
</script>

<div class="chart" bind:clientWidth={width}>
    <svg width = {width - padding.left - padding.right - 10} {height}>
        <!-- 4. Design the bars -->
        <g class="bars">
            {#each displayData as course, i}
                <Rect x = {xScale(i) + 2} {i} {yScale} value = {course[`${datasetId}_avg`]} width = {barWidth * 0.9}></Rect>
            {/each}
        </g>
        <!-- Design y axis -->
        <g class="axis y-axis">
            {#each yTicks as tick}
                <g class="tick tick-{tick}" transform="translate(0, {yScale(tick)})">
                    <line x2="100%" />
                    <text y="-4">{tick}</text>
                </g>
            {/each}
        </g>

        <!-- Design x axis -->
        <g class="axis x-axis">
            {#each displayData as course, i}
                <g class="tick" transform="translate({xScale(i)}, {height})">
                    <text x={barWidth / 2} y="-4">{course[`${datasetId}_dept`]} {course[`${datasetId}_id`]}</text>
                </g>
            {/each}
        </g>
    </svg>
</div>

<style>
    .chart {
        width: 100%;
        padding: 20px;
    }

    .x-axis .tick text {
        text-anchor: middle;
        color: white;
    }

    .tick {
        font-family: Poppins, sans-serif;
        font-size: 0.725em;
        font-weight: 200;
        color: white;
    }

    .tick text {
        fill: white;
        text-anchor: start;
        color: white;
    }

    .tick line {
        stroke: #152f49;
        stroke-dasharray: 2;
        opacity: 1;
    }

    .tick.tick-0 line {
        display: inline-block;
        stroke-dasharray: 0;
    }
</style>
