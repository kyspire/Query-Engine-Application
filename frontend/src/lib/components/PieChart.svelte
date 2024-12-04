<script lang="ts">
    import * as d3 from 'd3';

    // Props
    export let data;
    export let datasetId;
    export let width = 200;
    export let height = 200;

    // Calculate radius based on width/height
    let radius = Math.min(width, height) / 2;

    interface passFailData {
        name: string;
        value: number
    }

    // Create pie layout
    let pie = d3.pie<passFailData>()
        .value((d) => d.value)
        .sort(null);

    // Create arc generator
    let arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    // Process data for pie chart
    $: chartData = [
        { name: 'Pass', value: data[`${datasetId}_pass`] },
        { name: 'Fail', value: data[`${datasetId}_fail`] }
    ];

    // Generate pie segments
    $: arcs = pie(chartData);

    // Color scale
    let colors = d3.scaleOrdinal()
        .domain(['Pass', 'Fail'])
        .range(['#4CAF50', '#F44336']);
</script>

<div class="pie-chart">
    <svg {width} {height}>
        <g transform={`translate(${width/2},${height/2})`}>
            {#each arcs as segment}
                <path
                        d={arc(segment)}
                        fill={colors(segment.data.name)}
                />
            {/each}

            <!-- Add labels -->
            {#each arcs as segment}
                {@const centroid = arc.centroid(segment)}
                {@const isVisible = segment.endAngle - segment.startAngle > 0.1}
                {#if isVisible}
                    <text
                            x={centroid[0]}
                            y={centroid[1]}
                            dy=".35em"
                            text-anchor="middle"
                            fill="white"
                            font-size="12px"
                    >
                        {segment.data.name}: {segment.data.value}
                    </text>
                {/if}
            {/each}
        </g>
    </svg>
</div>

<style>
    .pie-chart {
        display: inline-block;
    }

    text {
        font-family: Arial, sans-serif;
        pointer-events: none;
    }
</style>