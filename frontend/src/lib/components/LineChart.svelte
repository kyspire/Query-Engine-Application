<script lang="ts">
    import { scaleTime, scaleLinear } from 'd3-scale';
    import { line, curveBasis } from 'd3-shape';
    import { draw } from 'svelte/transition';
    import Axis from "$lib/components/Axis.svelte";
    import {onMount} from "svelte";
    import Tooltip from "$lib/components/Tooltip.svelte";

    let show = $state(false);
    let m = $state({ x: 0, y: 0 });
    let hoveredData: Record<string, string | number> | null = $state.raw(null);
    onMount(()=> show = true)

    interface DataPoint {
        [key: string]: string | number | Date;
    }

    const { data, datasetId, minX, maxX, minY, maxY } = $props<{
        data: DataPoint[][];
        datasetId: string;
        minX: Date;
        maxX: Date;
        minY: number | undefined;
        maxY: number | undefined;
    }>();
    let width = $state(500);
    const height = 700;
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };

    const xScale = $derived(scaleTime()
        .domain([minX, maxX])
        .range([margin.left, width - margin.right]));

    const yScale = $derived(scaleLinear()
        .domain([minY || 0, maxY || 100])
        .range([height - margin.bottom, margin.top]));

    const lineGenerator = $derived(line<DataPoint>()
        .x((d) => {
            // Parse the year properly - assuming it's in a format like "2007" or "2007-01-01"
            const yearStr = d[`${datasetId}_year`].toString();
            // If it's just a year, convert to a proper date string
            const dateStr = yearStr.length === 4 ? `${yearStr}-01-01` : yearStr;
            return xScale(new Date(dateStr));
        })
        .y((d) => yScale(+(d[`overallAvg`])))
        .curve(curveBasis));

    function getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }


    function handleMousemove(event: MouseEvent) {
        m.x = event.clientX;
        m.y = event.clientY;
    }
</script>

<div class="wrapper" bind:clientWidth={width} onmouseleave={()=>hoveredData = null} role="figure" onmousemove={handleMousemove}>
    {#if data && data.length > 0 && width}
        <svg {width} {height}>
            <g onmouseleave={()=>hoveredData = null} role="figure">
                {#each data as datum}
                    {#if show}
                    <path
                            in:draw={{ duration: 2000 }}
                            shape-rendering="geometricPrecision"
                            d={lineGenerator(datum)}
                            stroke={getRandomColor()}
                            stroke-width={1.5}
                            stroke-linecap="round"
                            fill="none"
                            onmouseover={() => {
                                hoveredData = datum;
                            }}
                            onfocus={() => {
                                hoveredData = datum;
                            }}
                            role="figure"
                            opacity={hoveredData ? (hoveredData === datum ? "1" : "0.2") : "1"}
                    />
                    {/if}
                {/each}
                <Axis {width} {height} {margin} position="bottom" scale={xScale} />
                <Axis {width} {height} {margin} position="left" scale={yScale} />
            </g>
        </svg>
    {/if}
    {#if hoveredData}
        <Tooltip data={hoveredData[0]} x={m.x} y={m.y} {datasetId} {height}/>
    {/if}
</div>

<style>
    .wrapper {
        position: relative;
        width: 100%;
    }

    path {
        transition: all 300ms ease;
    }
</style>