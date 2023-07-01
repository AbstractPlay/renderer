import { Container as SVGContainer, Symbol as SVGSymbol } from "@svgdotjs/svg.js";
import { ISheet } from "./ISheet";

const sheet: ISheet = {
    name: "core",
    // tslint:disable-next-line:object-literal-sort-keys
    description: "This is the base contact sheet containing the default versions of all graphics used by Abstract Play.",
    cellsize: 100,
    glyphs: new Map<string, (canvas: SVGContainer) => SVGSymbol>(),
};

// Alphabetize by glyph name, please!
// The element's root `id` must be the same as its map key.
// Symbols must have a properly set `viewbox` for scaling to work correctly.

sheet.glyphs.set("cannon-piece", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("m 78.838853,129.34362 q 0.206705,0.20671 -0.124023,0.20671 -1.157549,1.03352 -2.893871,1.6123 l -0.578775,-0.95085 q 1.694982,-0.45475 2.893871,-1.48827 z m 4.175442,-6.49054 q 0.08268,0.20671 -0.289387,0.0827 -2.315097,0.24805 -4.960922,0.45475 l 0.04134,1.24024 h 5.70506 v 0.78547 H 81.56736 v 1.98437 h 2.604483 v 0.90951 h -9.260387 v -0.90951 h 2.149733 l -0.206705,-5.0436 0.950843,0.28939 q 2.521802,-0.33073 4.506171,-0.7028 z m -2.273756,4.54751 v -1.98437 h -2.893871 l 0.08268,1.98437 z m 0.248046,1.32292 q 1.157549,0.95084 3.100576,1.44693 l -0.454751,0.95084 q -1.860345,-0.45475 -3.26594,-1.69498 z")
        .attr("data-playerfill", true)
        .stroke({width: 0})
        .fill("#000");
    group.viewbox(74.911456, 121.9229215, 9.260386999999994, 9.260386999999994);
    return group;
});

sheet.glyphs.set("cannon-town", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.path("m 85.389067,111.12552 v 4.87824 h -0.826821 v -0.2067 h -2.149732 v 1.11621 h 3.224599 v 0.78548 h -3.224599 v 1.24023 h 4.175442 v 0.78548 h -9.136364 v -0.78548 h 4.134101 v -1.24023 h -3.224599 v -0.78548 h 3.224599 v -1.11621 H 79.43596 v 0.37207 h -0.82682 v -5.04361 z m -3.803374,1.94303 V 111.911 H 79.43596 v 1.15755 z m 2.976553,0 V 111.911 h -2.149732 v 1.15755 z m -2.976553,1.94303 v -1.15755 H 79.43596 v 1.15755 z m 2.976553,-1.15755 h -2.149732 v 1.15755 h 2.149732 z")
        .attr("data-playerfill", true)
        .stroke({width: 0})
        .fill("#000");
    // group.viewbox(77.451592, 110.856808, 9.136364, 9.136364);
    // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
    group.viewbox(77.45159912109375, 111.12551879882812, 9.136360168457031, 9.136360168457031);
    return group;
});

sheet.glyphs.set("dragon", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    const dragon = group.group();
    dragon.path("m 263.262,106.211 c 2.6,1.552 3.247,7.194 1.075,9.141 -2.077,0.105 -3.962,0.019 -5.377,-0.538 0.499,-1.652 3.367,-0.935 4.302,-2.151 0,-2.15 0,-4.301 0,-6.452 z")
        .fill({opacity: 0})
        .attr("fill-rule", "evenodd")
        .attr("clip-rule", "evenodd");
    dragon.path("m 242.292,112.664 c -24.772,11.32 -49.586,30.53 -44.088,67.208 4.425,29.521 35.045,45.071 66.671,49.465 11.206,1.557 21.695,0.359 32.26,3.226 -5.541,2.524 -13.982,2.148 -19.894,4.301 7.94,9.624 25.776,14.01 32.26,26.883 -15.354,-13.322 -43.042,-14.309 -61.832,-24.195 3.468,9.984 13.34,16.395 16.667,24.733 -23.058,-8.307 -36.991,-25.737 -52.154,-41.938 -0.539,7.917 5.007,14.327 7.527,20.969 -12.178,-8.075 -20.802,-24.362 -26.346,-40.863 -3.635,6.581 -3.838,16.593 -5.914,24.732 -6.093,-14.97 -7.286,-36.779 -5.915,-57.53 -6.233,3.625 -7.932,16.441 -13.979,22.044 -0.708,-23.868 10.329,-40.541 22.044,-53.767 -9.226,-1.247 -20.225,4.797 -27.421,9.14 3.044,-10.592 14.834,-17.349 26.346,-23.12 15.081,-7.556 33.209,-13.95 53.768,-11.288 z")
        .attr("data-playerfill", true)
        .attr("fill-rule", "evenodd")
        .attr("clip-rule", "evenodd");
    dragon.path("m 251.433,118.04 c -3.764,5.386 -10.131,7.672 -14.517,12.367 -4.299,4.603 -6.01,11.333 -11.829,14.517 -0.861,-2.903 0.165,-7.692 -2.688,-8.603 -7.226,3.886 -11.634,10.59 -13.979,19.356 1.683,1.821 3.186,-1.085 4.839,-1.075 1.059,1.988 1.073,5.02 2.688,6.452 1.972,0 3.943,0 5.915,0 -0.47,15.346 4.1,25.651 13.441,31.185 5.098,-2.43 1.7,-13.354 2.688,-19.894 3.292,-2.443 4.467,-7.003 3.764,-13.442 2.128,-1.457 5.184,-1.984 6.99,-3.764 12.825,6.71 25.207,13.864 33.335,25.271 -8.39,-2.596 -16.82,-15.367 -29.034,-12.366 -0.164,3.39 5.122,1.33 6.452,3.226 5.479,11.051 14.618,27.692 7.527,43.013 -1.206,-13.669 -1.804,-27.947 -12.366,-32.26 -2.406,2.976 0.818,6.777 1.612,10.753 1.74,8.713 0.233,18.816 -2.688,25.271 -1.986,-7.21 1.92,-28.182 -5.915,-28.497 -6.445,-0.259 -4.507,14.468 -3.226,19.894 -0.851,2.522 -1.923,-3.237 -4.301,-2.688 0.1,2.273 2.451,4.41 1.075,6.452 -15.401,-6.464 -24.114,-19.616 -31.185,-34.411 -2.72,11.189 7.318,18.814 11.291,26.883 -10.354,-9.163 -21.475,-20.718 -21.507,-37.637 -0.04,-20.929 18.585,-35.865 33.335,-44.089 5.622,-3.133 11.987,-6.666 18.283,-5.914 z")
        .attr("data-playerfill", true)
        .attr("fill-rule", "evenodd")
        .attr("clip-rule", "evenodd");
    dragon.path("m 293.908,118.04 c 4.188,2.803 7.726,6.254 9.141,11.829 -4.068,-2.667 -11.092,-4.897 -9.141,-11.829 z")
        .fill({opacity: 0})
        .attr("fill-rule", "evenodd")
        .attr("clip-rule", "evenodd");
    dragon.path("m 196.053,222.885 c 8.302,6.394 10.14,19.252 18.818,25.271 -0.873,4.504 -0.866,9.887 -2.151,13.979 -0.624,0.451 -1.441,0.709 -2.688,0.538 -1.307,4.301 -2.412,11.496 -1.076,16.668 3.982,0.218 4.654,-2.874 4.839,-6.452 8.037,-7.009 20.839,-21.181 35.486,-12.904 -14.3,0.475 -27.609,4.544 -26.883,18.28 8.697,-1.384 15.773,-8.125 25.808,-4.839 -8.458,4.806 -20.912,5.613 -23.658,16.13 10.764,3.754 26.719,2.315 30.11,13.442 -6.49,-4.084 -15.528,-5.62 -25.808,-5.915 -1.794,1.79 -1.988,5.181 -4.302,6.452 -7.068,-1.893 -15.876,-2.045 -20.969,-5.914 0.188,-1.783 3.099,-0.844 4.839,-1.075 -8.462,-11.61 -19.338,-20.808 -20.431,-39.787 2.083,2.396 3.752,5.209 6.452,6.989 -1.611,-10.332 -5.327,-21.041 -4.302,-32.26 2.631,0.595 2.493,3.959 3.226,6.452 2.254,-3.662 0.834,-10.996 2.69,-15.055 z")
        .attr("data-playerfill", true)
        .attr("fill-rule", "evenodd")
        .attr("clip-rule", "evenodd");
    dragon.path("m 357.354,268.587 c -5.271,-1.182 -9.542,-3.362 -14.518,-4.839 10.667,15.858 23.962,33.748 26.884,59.144 -5.729,-3.913 -8.629,-16.097 -15.593,-20.97 3.354,37.382 -9.446,65.093 -30.109,81.726 3.572,-8.794 10.304,-14.43 9.679,-27.421 -10.894,7.566 -20.994,15.926 -40.325,15.055 10.261,-5.694 21.705,-9.216 30.646,-16.668 13.808,-11.506 25.881,-30.04 25.271,-52.153 -1.018,-36.893 -31.514,-49.514 -58.605,-61.832 -0.088,-0.625 0.119,-0.957 0.538,-1.075 27.338,2.235 51.562,12.236 66.132,29.033 z")
        .attr("data-playerfill", true)
        .attr("fill-rule", "evenodd")
        .attr("clip-rule", "evenodd");
    dragon.path("m 288.532,148.688 c -1.27,2.895 1.907,6.128 2.15,9.678 0.113,1.652 -0.994,3.466 -0.538,4.839 1.216,3.654 4.898,2.499 5.915,5.915 -20.971,2.587 -35.734,-10.071 -44.627,-23.12 7.108,2.39 11.058,7.94 18.818,9.678 -0.055,-3.888 -2.631,-5.255 -2.15,-9.678 4.376,3.51 5.226,10.546 11.291,12.366 2.607,-4.567 0.202,-12.983 -0.538,-17.743 -4.62,-3.803 -11.977,-4.87 -13.979,-11.291 4.589,0.608 6.07,4.325 11.291,4.302 0.454,-13.729 -22.25,-8.927 -24.733,-21.507 1.942,0.208 3.588,0.713 4.839,1.613 -1.217,-2.91 -6.132,-6.768 -9.14,-9.678 -19.139,-1.943 -32.725,5.588 -46.239,5.914 8.295,-14.645 25.321,-20.56 46.777,-22.044 -7.456,-13.335 -20.366,-25.874 -25.808,-43.014 2.08,-0.76 3.247,2.328 4.301,3.764 9.199,12.525 19.143,27.703 31.185,37.637 -2.864,-18.403 -1.269,-40.246 9.14,-50.003 -5.963,12.566 -5.004,37.978 1.613,48.928 4.622,-12.404 8.239,-25.813 20.432,-30.647 -2.364,6.079 -10.596,11.849 -11.829,20.431 -1.381,9.611 1.087,17.83 6.452,23.12 2.416,-6.366 0.692,-16.871 4.302,-22.044 1.541,9.928 2.191,20.748 7.527,26.883 5.527,-8.104 8.35,-21.746 16.667,-25.271 -3.437,11.511 -9.583,18.92 -8.064,31.185 1.288,10.409 9.24,22.229 15.055,27.958 2.418,2.383 10.768,5.731 11.291,9.141 0.544,3.544 -3.684,5.842 -4.839,8.603 -2.573,6.144 -0.596,12.258 -2.151,18.281 -4.569,-4.033 -2.41,-14.795 -5.914,-19.894 -2.815,-0.486 -2.023,2.636 -4.839,2.15 -6.089,-6.995 -11.997,-14.169 -18.818,-20.431 -1.349,0.802 -1.888,2.414 -2.688,3.764 7.73,9.104 11.504,20.583 17.743,30.647 3.326,5.366 7.73,10.178 11.291,15.592 3.521,5.355 7.255,10.374 10.753,15.592 -4.582,-3.48 -7.902,-8.502 -11.828,-13.441 -3.795,-4.774 -8.569,-8.58 -12.366,-13.442 -6.225,-7.97 -8.048,-20.043 -17.745,-24.733 z m -25.27,-36.024 c -0.935,1.216 -3.803,0.499 -4.302,2.151 1.415,0.557 3.3,0.643 5.377,0.538 2.172,-1.947 1.524,-7.588 -1.075,-9.141 0,2.15 0,4.301 0,6.452 z m 39.787,17.205 c -1.415,-5.575 -4.953,-9.026 -9.141,-11.829 -1.951,6.932 5.073,9.162 9.141,11.829 z")
        .attr("data-playerfill", true)
        .attr("fill-rule", "evenodd")
        .attr("clip-rule", "evenodd");
    dragon.path("m 312.189,258.909 c 14.232,10.422 29.512,28.838 27.421,54.304 -2.314,28.189 -29.245,50.018 -58.605,52.154 -15.459,1.125 -28.979,-0.753 -40.863,-4.302 -6.124,-1.828 -12.88,-3.723 -16.668,-8.064 6.263,-1.981 16.122,-0.366 20.432,-4.302 -12.581,-4.267 -32.448,-1.246 -41.938,-8.603 3.944,-2.149 12.551,0.364 14.517,-3.764 -2.866,-4.918 -9.122,-4.659 -13.441,-4.302 -15.306,1.269 -32.027,16.142 -33.873,31.723 -3.46,29.2 18.003,47.679 45.702,45.164 10.133,-0.92 18.401,-5.49 27.958,-8.064 -9.756,10.57 -32.167,15.001 -51.616,10.753 2.599,6.524 14.458,9.058 24.732,9.678 18.012,1.088 35.729,-5.48 49.465,-8.603 -11.149,10.895 -33.801,10.288 -50.003,16.13 6.945,4.585 17.034,3.798 27.421,4.839 37.516,3.763 64.923,-10.672 80.65,-31.185 -0.911,-1.221 -3.59,0.317 -4.302,1.075 -0.023,-1.731 5.679,-4.951 8.065,-4.301 -4.836,11.356 -15.681,20.358 -26.346,27.421 -18.439,12.211 -40.379,16.917 -74.198,14.517 4.234,4.463 10.866,7.886 17.743,11.291 6.771,3.354 14.354,5.252 20.969,8.603 -35.785,-1.134 -51.34,-22.498 -76.886,-33.872 0.805,8.964 8.459,14.545 14.517,19.894 6.274,5.539 13.911,9.786 19.356,15.592 -34.405,-16.136 -60.042,-41.038 -61.832,-89.79 -2.536,0.167 -3.075,5.15 -4.839,4.301 0.429,-14.088 7.855,-21.179 9.678,-33.873 3.95,-4.652 8.697,-8.508 13.441,-12.366 0.133,-1.812 -3.216,-1.559 -1.613,-3.226 4.411,-2.399 10.726,-2.896 15.592,-4.839 -1.15,-2.076 -4.81,-1.643 -6.452,-3.227 8.667,-2.974 19.958,0.373 27.421,2.151 0.696,-1.789 -2.86,-3.938 -3.226,-6.452 8.894,2.576 13.495,9.445 20.969,13.441 0.184,-3.769 -2.597,-4.572 -2.688,-8.065 11.935,4.375 16.922,15.696 26.345,22.582 -1.464,-5.705 -5.625,-8.712 -6.989,-14.517 13.027,6.149 21.377,16.977 33.873,23.657 -1.246,-6.821 -7.19,-13.598 -10.754,-19.894 11.049,1.498 18.476,11.274 27.959,16.13 1.102,-6.898 -6.645,-12.291 -6.989,-17.743 9.642,2.188 17.21,6.447 25.271,10.216 -0.869,-5.073 -11.175,-8.146 -12.367,-12.904 6.142,-1.207 12.552,-2.145 18.281,-3.764 -2.071,-2.051 -7.505,-0.739 -9.678,-2.688 7.03,-6.77 17.252,-10.349 18.817,-22.582 -5.073,1.02 -6.64,5.547 -11.828,6.451 2.384,-6.421 6.481,-13.918 4.839,-22.581 -1.68,-1.818 -2.132,2.138 -4.301,1.612 1.301,-12.946 -4.976,-18.319 -9.139,-25.806 z")
        .attr("data-playerfill", true)
        .attr("fill-rule", "evenodd")
        .attr("clip-rule", "evenodd");
    // @ts-expect-error
    dragon.flip("x", {x: 0, y: 0});
    group.viewbox(-475.9079999999999, 36.31599999999999, 426.3689999999998, 426.3689999999998);
    return group;
});

sheet.glyphs.set("house", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    const house = group.group();
    house.rect(66.07, 21.700001).x(0.70999998).y(17.610001)
        .stroke({width: 1, color: "black"})
        .fill("none")
        .attr("data-playerfill", true);
    house.polygon("61.74,0.5 6.78,0.5 0.71,17.61 66.78,17.61")
        .stroke({width: 1, color: "black"})
        .fill("none")
        .attr("data-playerfill", true);
    group.viewbox(-6.2550000100000025, -39.689998, 80, 80);
    return group;
});

sheet.glyphs.set("palace", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    const palace = group.group();
    palace.polygon("64.94,33.45 33.35,13.89 33.35,0.93 61.38,19.52")
        .stroke({width: 1, color: "black"})
        .fill("none")
        .attr("data-playerfill", true);
    palace.polygon("0.86,33.45 33.35,13.89 33.35,0.93 5.38,18.86")
        .stroke({width: 1, color: "black"})
        .fill("none")
        .attr("data-playerfill", true);
    palace.polygon("64.94,57.38 64.94,33.45 33.35,13.89 0.86,33.45 0.86,57.38")
        .stroke({width: 1, color: "black"})
        .fill("none")
        .attr("data-playerfill", true);
    group.viewbox(-7.1000000000000005, -21.619999999999997, 80, 80);
    return group;
});

sheet.glyphs.set("piece", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    const border = 5;
    group.circle(sheet.cellsize)
        .attr("data-playerfill", true)
        .fill("#fff")
        .stroke({width: border, color: "#000"})
        .center(sheet.cellsize / 2, sheet.cellsize / 2);
    group.viewbox(border / 2 * -1, border / 2 * -1, sheet.cellsize + border, sheet.cellsize + border);
    return group;
});

sheet.glyphs.set("piece-borderless", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    const border = 0;
    group.circle(sheet.cellsize)
        .attr("data-playerfill", true)
        .fill("#fff")
        .stroke({width: border, color: "#000", opacity: 0})
        .center(sheet.cellsize / 2, sheet.cellsize / 2);
    group.viewbox(border / 2 * -1, border / 2 * -1, sheet.cellsize + border, sheet.cellsize + border);
    return group;
});

sheet.glyphs.set("piece-chariot", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    const border = 5;
    group.circle(sheet.cellsize - border)
        .attr("data-playerfill", true)
        .fill("#fff")
        .stroke({width: border, color: "#000"})
        .center(sheet.cellsize / 2, sheet.cellsize / 2);
    group.circle(sheet.cellsize * 0.7)
        .fill("none")
        .stroke({width: border * 2, color: "#000"})
        .center(sheet.cellsize / 2, sheet.cellsize / 2);
    group.circle (border * 2)
        .fill("none")
        .stroke({width: border / 4, color: "#000"})
        .center(sheet.cellsize / 2, sheet.cellsize / 2);

    group.viewbox(border / 2 * -1, border / 2 * -1, sheet.cellsize + border, sheet.cellsize + border);
    return group;
});

sheet.glyphs.set("piece-horse", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    const border = 5;
    group.circle(sheet.cellsize - border)
        .attr("data-playerfill", true)
        .fill("#fff")
        .stroke({width: border, color: "#000"})
        .center(sheet.cellsize / 2, sheet.cellsize / 2);
    group.circle(sheet.cellsize * 0.7)
        .fill("none")
        .stroke({width: border * 2, color: "#000", dasharray: "10"})
        .center(sheet.cellsize / 2, sheet.cellsize / 2);

    group.viewbox(border / 2 * -1, border / 2 * -1, sheet.cellsize + border, sheet.cellsize + border);
    return group;
});

sheet.glyphs.set("piece-square", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    const border = 2;
    group.rect(sheet.cellsize, sheet.cellsize)
        .attr("data-playerfill", true)
        .fill("#fff")
        .stroke({width: border, color: "#000"})
        .center(sheet.cellsize / 2, sheet.cellsize / 2);
    group.viewbox(border / 2 * -1, border / 2 * -1, sheet.cellsize + border, sheet.cellsize + border);
    return group;
});

sheet.glyphs.set("piece-square-borderless", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    const border = 0;
    group.rect(sheet.cellsize, sheet.cellsize)
        .attr("data-playerfill", true)
        .fill("#fff")
        .stroke({width: border, color: "#000", opacity: 0})
        .center(sheet.cellsize / 2, sheet.cellsize / 2);
    group.viewbox(border / 2 * -1, border / 2 * -1, sheet.cellsize + border, sheet.cellsize + border);
    return group;
});

sheet.glyphs.set("piece-triangle", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    const cellsize = 180;
    const halfcell = cellsize / 2;
    const height = 175;
    const base = 100;
    group.polygon(`${halfcell},${halfcell - height / 2} ${(halfcell) - (base / 2)},${halfcell + height / 2} ${(halfcell) + (base / 2)},${halfcell + height / 2}`)
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#fff");
    group.viewbox(0, 0, cellsize, cellsize);
    return group;
});

sheet.glyphs.set("piece-triangle-dot", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    const cellsize = 180;
    const halfcell = cellsize / 2;
    const height = 175;
    const base = 100;
    const x1 = halfcell;
    const y1 = halfcell - height / 2;
    const x2 = (halfcell) - (base / 2);
    const y2 = halfcell + height / 2;
    const x3 = (halfcell) + (base / 2);
    const y3 = halfcell + height / 2;
    const cx = (x1 + x2 + x3) / 3;
    const cy = (y1 + y2 + y3) / 3;
    group.polygon(`${x1},${y1} ${x2},${y2} ${x3},${y3}`)
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#fff");
    group.circle(base / 3)
        .fill("#000")
        .center(cx, cy);
    group.viewbox(0, 0, cellsize, cellsize);
    return group;
});

sheet.glyphs.set("sphere-spiral", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    const sphere = group.group();
    sphere.circle().cx(210.5).cy(210.5).radius(200)
        .stroke({width: 5, color: "black"})
        .fill("none")
        .attr("data-playerfill", true);
    sphere.path("M255.55 405.36c-35.749 7.858-73.367 6.139-108.22-5.092m167.92-19.631c-49.05 27.441-109.02 32.427-162.93 18.068-23.251-5.986-45.237-16.405-64.686-30.473m268.16-20.862c-35.076 32.734-83.252 47.924-130.47 50.353-52.85 2.354-107.76-10.846-150.17-43.395-9.533-7.546-17.938-16.147-25.736-25.455m338.45-26.274c-19.622 33.291-53.486 55.792-89.458 68.217-48.883 17.101-102.98 18.343-152.96 5.15-41.172-10.98-81.07-32.744-106.73-67.507-6.847-9.275-11.85-19.34-16.324-29.931m379.59-12.008c-11.304 28.949-33.936 52.201-60.396 67.913-41.8 25.205-91.676 34.761-140.09 32.718-47.849-2.427-95.914-16.694-134.63-45.515-25.398-19.504-46.513-46.428-53.193-78.283l-.97-3.644m396.18-11.924c-4.841 23.535-17.54 44.808-34.672 61.489-32.824 31.618-77.391 48.446-122.03 54.483-51.714 6.666-105.74-.631-152.71-23.702-31.582-15.7-60.497-39.497-76.358-71.505-7.839-15.258-11.467-32.063-12.037-49.141m395.46-28.104c3.44 21.926-.457 44.727-11.272 64.133-18.271 33.084-51.067 55.847-85.775 69.187-51.58 19.912-109.46 21.782-162.79 7.924-40.561-10.931-79.692-31.96-105.93-65.454-17.927-23.385-28.042-53.574-23.504-83.085l.397-4.174m377.4-25.704c8.345 24.193 6.99 51.682-5.187 74.343-15.488 31.155-45.102 52.817-76.348 66.587-52.527 22.102-112.67 24.811-167.36 9.284-39.276-11.16-77.313-32.762-100.87-66.866-18.198-25.643-24.767-59.756-14.595-89.819 1.709-7.223 5.807-13.596 8.632-20.413m328.27-20.447c15.439 20.262 24.25 46.355 19.699 71.838-5.751 34.641-31.935 62.235-61.625 79.061-46.445 26.056-102.51 32.539-154.46 22.61-43.271-8.265-86.32-29.103-112.53-65.559-17.491-24.374-23.858-56.955-13.685-85.538 5.591-17.098 16.356-31.894 28.837-44.671m256.16-14.371c23.24 17.696 42.024 44.313 42.08 74.456.514 31.152-19.085 59.055-43.712 76.573-43.524 30.486-100.05 38.52-151.65 28.967-39.963-7.638-80.244-26.952-103.31-61.639-17.376-24.994-19.944-59.526-5.06-86.295 13.022-25.355 36.986-43.271 62.394-55.067m141.61-6.799c32.579 11.124 64.873 32.846 76.207 66.84 8.96 26.974-1.601 57.232-22.053 76.067-32.052 30.781-78.77 41.655-122.17 38.963-41.496-3.024-84.994-19.351-109.95-54.18-15.735-22.005-18.498-52.761-4.818-76.434 19.035-34.366 58.007-52.474 95.581-57.934 42.845-5.775 90.425 3.075 122.46 33.813 17.07 16.814 25.956 43.305 16.504 66.205-12.519 31.554-45.874 48.939-77.66 55.14-42.789 7.838-91.506-1.137-122.69-33.208-17.052-17.801-23.676-46.173-11.423-68.384 16.297-31.279 52.682-46.416 86.407-48.77 33.832-2.368 71.755 7.153 93.237 35.138 12.854 16.914 12.131 42.077-2.127 57.928-23.35 27.197-63.264 34.301-97.119 27.277-25.265-5.291-52.663-21.167-58.129-48.307-4.853-24.18 14.572-45.76 35.8-54.177C200.24 23.9 239.16 26.002 262.876 49.782c12.424 12.344 12.531 33.848-.35 45.922-23.364 22.258-64.275 23.307-88.762 2.303-12.354-10.191-13.797-30.612-1.233-41.251 17.168-15.857 48.004-17.888 64.956-.751 9.527 9.354 2.823 25.231-9 28.67-11.478 4.756-30.15 3.256-34.358-10.471-1.632-9.618 14.527-15.942 19.14-7.483.08 1.48-1.48 2.402-2.803 2.362")
        .stroke({width: 2, color: "black"})
        .fill("none")
    group.viewbox(0, 0, 421, 421);
    return group;
});

sheet.glyphs.set("tower", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    const tower = group.group();
    tower.polygon("32.5,0.9 60.05,18.12 64.61,32.12 32.5,12.23")
        .stroke({width: 1, color: "black"})
        .fill("none")
        .attr("data-playerfill", true);
    tower.polygon("32.5,0.9 4.94,17.46 0.83,32.12 32.5,12.23")
        .stroke({width: 1, color: "black"})
        .fill("none")
        .attr("data-playerfill", true);
    tower.polygon("64.61,32.12 32.5,12.23 0.83,32.12 0.83,78.46 64.61,78.46")
        .stroke({width: 1, color: "black"})
        .fill("none")
        .attr("data-playerfill", true);
    group.viewbox(-7.279999999999999, -0.540000000000012, 80, 80);
    return group;
});

sheet.glyphs.set("wyke-1", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    const rectsym = group.symbol();
    rectsym.rect(50, 50)
        .fill("none")
        .attr("data-playerfill", true)
        .stroke({width: 1, color: "black"})
    rectsym.viewbox(-1, -1, 52, 52);
    group.use(rectsym).size(50, 50);
    group.viewbox(-1, -1, 102, 102);
    return group;
});

sheet.glyphs.set("wyke-2", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    const rectsym = group.symbol();
    rectsym.rect(50, 50)
        .fill("none")
        .attr("data-playerfill", true)
        .stroke({width: 1, color: "black"})
    rectsym.viewbox(-1, -1, 52, 52);
    group.use(rectsym).size(50, 50);
    group.use(rectsym).size(50, 50).dx(50);
    group.viewbox(-1, -1, 102, 102);
    return group;
});

sheet.glyphs.set("wyke-3", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    const rectsym = group.symbol();
    rectsym.rect(50, 50)
        .fill("none")
        .attr("data-playerfill", true)
        .stroke({width: 1, color: "black"})
    rectsym.viewbox(-1, -1, 52, 52);
    group.use(rectsym).size(50, 50);
    group.use(rectsym).size(50, 50).dx(50);
    group.use(rectsym).size(50, 50).dy(50);
    group.viewbox(-1, -1, 102, 102);
    return group;
});

sheet.glyphs.set("wyke-4", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    const rectsym = group.symbol();
    rectsym.rect(50, 50)
        .fill("none")
        .attr("data-playerfill", true)
        .stroke({width: 1, color: "black"})
    rectsym.viewbox(-1, -1, 52, 52);
    group.use(rectsym).size(50, 50);
    group.use(rectsym).size(50, 50).dx(50);
    group.use(rectsym).size(50, 50).dy(50);
    group.use(rectsym).size(50, 50).dmove(50,50);
    group.viewbox(-1, -1, 102, 102);
    return group;
});

sheet.glyphs.set("wyke-5", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    const rectsym = group.symbol();
    rectsym.rect(50, 50)
        .fill("none")
        .attr("data-playerfill", true)
        .stroke({width: 1, color: "black"})
    rectsym.viewbox(-1, -1, 52, 52);
    group.use(rectsym).size(50, 50);
    group.use(rectsym).size(50, 50).dx(50);
    group.use(rectsym).size(50, 50).dy(50);
    group.use(rectsym).size(50, 50).dmove(50,50);
    group.use(rectsym).size(37.5, 37.5).dmove(6.25, 6.25);
    group.viewbox(-1, -1, 102, 102);
    return group;
});

sheet.glyphs.set("wyke-6", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    const rectsym = group.symbol();
    rectsym.rect(50, 50)
        .fill("none")
        .attr("data-playerfill", true)
        .stroke({width: 1, color: "black"})
    rectsym.viewbox(-1, -1, 52, 52);
    group.use(rectsym).size(50, 50);
    group.use(rectsym).size(50, 50).dx(50);
    group.use(rectsym).size(50, 50).dy(50);
    group.use(rectsym).size(50, 50).dmove(50,50);
    group.use(rectsym).size(37.5, 37.5).dmove(6.25, 6.25);
    group.use(rectsym).size(37.5, 37.5).dmove(56.25, 6.25);
    group.viewbox(-1, -1, 102, 102);
    return group;
});

sheet.glyphs.set("wyke-7", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    const rectsym = group.symbol();
    rectsym.rect(50, 50)
        .fill("none")
        .attr("data-playerfill", true)
        .stroke({width: 1, color: "black"})
    rectsym.viewbox(-1, -1, 52, 52);
    group.use(rectsym).size(50, 50);
    group.use(rectsym).size(50, 50).dx(50);
    group.use(rectsym).size(50, 50).dy(50);
    group.use(rectsym).size(50, 50).dmove(50,50);
    group.use(rectsym).size(37.5, 37.5).dmove(6.25, 6.25);
    group.use(rectsym).size(37.5, 37.5).dmove(56.25, 6.25);
    group.use(rectsym).size(37.5, 37.5).dmove(6.25, 56.25);
    group.viewbox(-1, -1, 102, 102);
    return group;
});

export { sheet as CoreSheet };
