<script>
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';
    import { interpolate } from 'd3-interpolate';

    export let x;
    export let value;
    export let yScale;

    export let width;
    export let i;

    const tweenParams = {
        delay: 300 + i * 50,
        duration: 500,
        interpolate,
        easing: cubicOut
    };

    const tY = tweened(undefined, tweenParams);

    $: tY.set(value);
</script>

<rect
        {x}
        {width}
        y={yScale($tY)}
        height={yScale(90) - yScale($tY)}
        stroke="none" />

<style>
    rect {
        fill: #da3464;
        stroke: none;
    }
</style>