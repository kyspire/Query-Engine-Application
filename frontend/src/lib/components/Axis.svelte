<script lang="ts">
    import { select } from 'd3-selection';
    import { axisBottom, axisLeft } from 'd3-axis';
    import { format } from 'd3-format';
    import { timeFormat } from 'd3-time-format';

    export let width;
    export let height;
    export let margin;
    export let position;
    export let scale;
    export let tick_outer = undefined;
    export let tick_number = undefined;
    export let to_format = undefined;
    export let no_domain = undefined;
    export let formatString = '$.0f';

    const yearFormat = timeFormat('%Y');
    const formatter = format(formatString);
    let transform: string;
    let g: SVGElement;

    $: {
        select(g).selectAll('*').remove();

        let axis;

        if (width && scale) {
            switch (position) {
                case 'bottom':
                    axis = axisBottom<Date>(scale)
                        .ticks(tick_number || 8)
                        .tickFormat((d: Date) => yearFormat(d))
                        .tickSizeOuter(tick_outer || 0);
                    transform = `translate(0, ${height - margin.bottom})`;
                    break;
                case 'left':
                    if (to_format) {
                        axis = axisLeft(scale)
                            .tickSizeOuter(tick_outer || 0)
                            .tickFormat((d) => formatter(d as number))
                            .ticks(tick_number || 5);
                    } else {
                        axis = axisLeft(scale)
                            .ticks(tick_number || 5)
                            .tickSizeOuter(tick_outer || 0);
                    }
                    transform = `translate(${margin.left}, 0)`;
                    break;
            }

            if (no_domain) {
                select(g).call(axis!).select('.domain').remove();
            } else {
                select(g).call(axis!);
            }
        }
    }
</script>

<g class="axis" bind:this={g} {transform} />

<style>
    .axis {
        shape-rendering: crispEdges;
    }
</style>